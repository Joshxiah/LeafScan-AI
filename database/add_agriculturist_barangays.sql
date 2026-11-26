-- ============================================================
-- LeafScan AI - An agriculturist can cover MORE THAN ONE barangay
--
-- Before this, agriculturists.barangay held a single value, so an
-- agriculturist who handles two or more barangays could not be
-- recorded. The service area now lives in this join table, one row
-- per (agriculturist, barangay).
--
-- Existing single barangays are copied over, so nobody loses their
-- current service area. The old agriculturists.barangay column is
-- LEFT IN PLACE (the app no longer reads or writes it) so this
-- migration drops nothing; remove it later with
--   ALTER TABLE agriculturists DROP COLUMN barangay;
-- once you are happy with the new data.
--
-- Run ONCE, after add_agriculturists.sql. Safe to re-run.
-- ============================================================

USE leafscan_ai;

CREATE TABLE IF NOT EXISTS agriculturist_barangays (
  agriculturist_id INT UNSIGNED NOT NULL,
  barangay         VARCHAR(150) NOT NULL,

  PRIMARY KEY (agriculturist_id, barangay),
  KEY idx_agriculturist_barangays_barangay (barangay),

  CONSTRAINT fk_agriculturist_barangays_agriculturist
    FOREIGN KEY (agriculturist_id) REFERENCES agriculturists (id)
    ON DELETE CASCADE ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carry each agriculturist's current barangay over. INSERT IGNORE
-- keeps a re-run from tripping on the (agriculturist, barangay) key.
INSERT IGNORE INTO agriculturist_barangays (agriculturist_id, barangay)
SELECT id, TRIM(barangay)
FROM agriculturists
WHERE barangay IS NOT NULL AND TRIM(barangay) <> '';

-- ============================================================
-- END
-- ============================================================
