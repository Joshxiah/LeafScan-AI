-- ============================================================
-- LeafScan AI - CAO review layer on detections
--
-- A detection stores the model's raw output permanently (see the
-- comment on `predicted_class` in leafscan_ai_schema.sql). So the
-- CAO does NOT edit the AI fields - instead this adds a parallel
-- review layer: an agronomist can mark a scan "confirmed" or
-- "corrected" (naming the class it really is) and leave a note,
-- without ever touching predicted_class / disease_id / risk_level.
--
-- Run ONCE, after leafscan_ai_schema.sql. Safe to re-run: every
-- step is guarded via information_schema.
-- ============================================================

USE leafscan_ai;

SET @db := DATABASE();

SET @has_col := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'detections' AND column_name = 'review_status'
);
SET @sql := IF(@has_col = 0,
  'ALTER TABLE detections
     ADD COLUMN review_status ENUM(''unreviewed'',''confirmed'',''corrected'')
                 NOT NULL DEFAULT ''unreviewed'' AFTER model_version,
     ADD COLUMN corrected_class VARCHAR(50) DEFAULT NULL AFTER review_status,
     ADD COLUMN review_note     TEXT DEFAULT NULL AFTER corrected_class,
     ADD COLUMN reviewed_by     INT UNSIGNED DEFAULT NULL AFTER review_note,
     ADD COLUMN reviewed_at     TIMESTAMP NULL DEFAULT NULL AFTER reviewed_by,
     ADD KEY idx_detections_review_status (review_status)',
  'SELECT "detections review columns already present"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @has_fk := (
  SELECT COUNT(*) FROM information_schema.table_constraints
  WHERE table_schema = @db AND table_name = 'detections'
    AND constraint_name = 'fk_detections_reviewed_by'
);
SET @sql := IF(@has_fk = 0,
  'ALTER TABLE detections
     ADD CONSTRAINT fk_detections_reviewed_by
       FOREIGN KEY (reviewed_by) REFERENCES users (id)
       ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT "fk_detections_reviewed_by already present"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================
-- END
-- ============================================================
