-- ============================================================
-- LeafScan AI - Record which agriculturist is sent to a report
--
-- When the CAO moves a report to "Agriculturist Assigned" (or
-- "Agriculturist Visit Required") they now name the person going
-- out. It is stored on the report and relayed to the farmer in the
-- status-change notification.
--
-- Run ONCE, after add_report_workflow.sql. Re-runnable.
-- ============================================================

USE leafscan_ai;

SET @db := DATABASE();
SET @has := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'reports' AND column_name = 'assigned_agriculturist'
);
SET @sql := IF(@has = 0,
  'ALTER TABLE reports
     ADD COLUMN assigned_agriculturist VARCHAR(150) DEFAULT NULL AFTER cao_message',
  'SELECT "reports.assigned_agriculturist already present"');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
