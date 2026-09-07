-- ============================================================
-- LeafScan AI - Farmer <-> CAO reporting workflow
--
-- Adds everything the seamless reporting flow needs:
--
--   reports.is_read / read_at   Messenger-style unread state -
--                               a report is unread until the CAO
--                               opens it.
--   reports.cao_message         optional note the CAO leaves for
--                               the farmer with a status change.
--   reports.status              widened from pending/reviewed/resolved
--                               to the full field-assessment lifecycle.
--
--   report_images               the farmer's OWN scan photos, tied
--                               to a report and to the disease each
--                               photo was classified as, so the CAO
--                               can visually verify "is this really
--                               Common Rust, and how bad is it?".
--
--   notifications               one inbox table for BOTH sides:
--                               the CAO when a report is filed, the
--                               farmer when their report is acted on.
--
-- Run ONCE, after add_reports.sql. Safe to re-run: every step is
-- guarded or idempotent.
-- ============================================================

USE leafscan_ai;

-- ------------------------------------------------------------
-- 1. reports: unread state + CAO message
-- ------------------------------------------------------------

-- `IF NOT EXISTS` on ADD COLUMN needs MySQL 8.0.29+. XAMPP's 8.0.x
-- may be older, so guard by hand via information_schema instead.

SET @db := DATABASE();

SET @has_is_read := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'reports' AND column_name = 'is_read'
);
SET @sql := IF(@has_is_read = 0,
  'ALTER TABLE reports
     ADD COLUMN is_read  TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
     ADD COLUMN read_at  TIMESTAMP NULL DEFAULT NULL AFTER is_read,
     ADD COLUMN read_by  INT UNSIGNED DEFAULT NULL AFTER read_at,
     ADD COLUMN cao_message TEXT DEFAULT NULL AFTER read_by',
  'SELECT "reports workflow columns already present"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------
-- 2. reports.status: widen the lifecycle
--
-- Old:  pending | reviewed | resolved
-- New:  pending | under_review | verified | agriculturist_required
--       | agriculturist_assigned | field_assessment_completed | resolved
--
-- Done in two steps so no existing row is ever left with an
-- invalid value: first add the new members alongside the old,
-- remap 'reviewed', then drop 'reviewed'.
-- ------------------------------------------------------------

ALTER TABLE reports
  MODIFY COLUMN status ENUM(
    'pending','reviewed','under_review','verified','agriculturist_required',
    'agriculturist_assigned','field_assessment_completed','resolved'
  ) NOT NULL DEFAULT 'pending';

UPDATE reports SET status = 'under_review' WHERE status = 'reviewed';

ALTER TABLE reports
  MODIFY COLUMN status ENUM(
    'pending','under_review','verified','agriculturist_required',
    'agriculturist_assigned','field_assessment_completed','resolved'
  ) NOT NULL DEFAULT 'pending';

-- A report that has already been acted on has obviously been seen.
UPDATE reports
SET is_read = 1,
    read_at = COALESCE(reviewed_at, created_at)
WHERE status <> 'pending' AND is_read = 0;

-- ------------------------------------------------------------
-- 3. report_images - the farmer's real scan photos for a report
--
-- One row per photo the farmer chose to include. class_label /
-- display_name mirror the disease the phone classified that photo
-- as (or NULL for a healthy leaf), so the CAO's Report Details can
-- group photos under each reported disease. image_path is the same
-- "uploads/xxx.jpg" convention detections.image_path uses.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS report_images (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  report_id         INT UNSIGNED NOT NULL,
  detection_id      INT UNSIGNED DEFAULT NULL,
  class_label       VARCHAR(50)  DEFAULT NULL,
  display_name      VARCHAR(150) DEFAULT NULL,
  image_path        VARCHAR(255) NOT NULL,
  confidence_score  DECIMAL(5,2) DEFAULT NULL,
  risk_level        ENUM('none','low','moderate','high') DEFAULT NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_report_images_report_id (report_id),
  KEY idx_report_images_class_label (class_label),

  CONSTRAINT fk_report_images_report
    FOREIGN KEY (report_id) REFERENCES reports (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_report_images_detection
    FOREIGN KEY (detection_id) REFERENCES detections (id)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. notifications - one inbox for both the CAO and farmers
--
-- user_id is the RECIPIENT. A farmer submitting a report writes
-- one notification per active admin; an admin changing a report's
-- status writes one notification back to that report's farmer.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  type        VARCHAR(40)  NOT NULL,
  title       VARCHAR(180) NOT NULL,
  body        VARCHAR(500) DEFAULT NULL,
  report_id   INT UNSIGNED DEFAULT NULL,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  read_at     TIMESTAMP NULL DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_notifications_user (user_id, is_read, created_at),
  KEY idx_notifications_report (report_id),

  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT fk_notifications_report
    FOREIGN KEY (report_id) REFERENCES reports (id)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- END
-- ============================================================
