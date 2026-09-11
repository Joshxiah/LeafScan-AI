-- ============================================================
-- LeafScan AI - Agriculturist directory
--
-- The City Agriculture Office keeps a list of the agriculturists
-- it can send to a farmer's area for a field assessment. Before
-- this, the person sent was typed as FREE TEXT on the report
-- (reports.assigned_agriculturist, added in add_agriculturist_name.sql).
--
-- Now the CAO picks from this table instead. The report keeps BOTH
-- a foreign key to the chosen agriculturist AND a copy of the name
-- as free text, so a historical report still reads correctly even
-- if that agriculturist row is later edited or deleted.
--
-- Run ONCE, after add_agriculturist_name.sql. Safe to re-run:
-- every step is guarded via information_schema.
-- ============================================================

USE leafscan_ai;

-- ------------------------------------------------------------
-- 1. agriculturists - the directory itself
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agriculturists (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name      VARCHAR(150) NOT NULL,
  phone_number   VARCHAR(20)  DEFAULT NULL,
  email          VARCHAR(150) DEFAULT NULL,
  barangay       VARCHAR(150) DEFAULT NULL,
  municipality   VARCHAR(100) DEFAULT 'Pagadian City',
  specialization VARCHAR(150) DEFAULT NULL,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_agriculturists_is_active (is_active),
  KEY idx_agriculturists_barangay (barangay)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. reports.assigned_agriculturist_id - FK into the directory
--
-- `IF NOT EXISTS` on ADD COLUMN needs MySQL 8.0.29+, which XAMPP
-- may be short of - so guard by hand via information_schema, the
-- same way add_report_workflow.sql does.
-- ------------------------------------------------------------

SET @db := DATABASE();

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'reports'
    AND column_name = 'assigned_agriculturist_id'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE reports
     ADD COLUMN assigned_agriculturist_id INT UNSIGNED DEFAULT NULL AFTER assigned_agriculturist,
     ADD KEY idx_reports_agriculturist (assigned_agriculturist_id)',
  'SELECT "reports.assigned_agriculturist_id already present"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk := (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = @db AND table_name = 'reports'
    AND constraint_name = 'fk_reports_agriculturist'
);
SET @sql := IF(@has_fk = 0,
  'ALTER TABLE reports
     ADD CONSTRAINT fk_reports_agriculturist
       FOREIGN KEY (assigned_agriculturist_id) REFERENCES agriculturists (id)
       ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT "fk_reports_agriculturist already present"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- END
-- ============================================================
