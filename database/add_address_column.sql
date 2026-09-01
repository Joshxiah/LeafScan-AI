-- ============================================================
-- LeafScan AI - Add an address column to the farmers table
--
-- The registration form collects a single free-text address
-- instead of a separate barangay field.
-- ============================================================

USE leafscan_ai;

ALTER TABLE farmers
    ADD COLUMN address VARCHAR(255) DEFAULT NULL AFTER user_id;

-- Preserve any existing barangay values.
UPDATE farmers
SET address = barangay
WHERE barangay IS NOT NULL;