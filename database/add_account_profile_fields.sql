-- ============================================================
-- LeafScan AI - Account profile + full address fields
--
-- Supports the CAO's "Create Account" form (Users page), which now
-- creates either a farmer or an admin account and captures gender,
-- date of birth, and - for farmers - a full Region/Province/City-
-- Municipality/Barangay address (municipality/barangay columns
-- already existed; region/province are new).
-- ============================================================

USE leafscan_ai;

ALTER TABLE users
    ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT NULL AFTER phone_number,
    ADD COLUMN date_of_birth DATE DEFAULT NULL AFTER gender;

ALTER TABLE farmers
    ADD COLUMN region VARCHAR(100) DEFAULT NULL AFTER user_id,
    ADD COLUMN province VARCHAR(100) DEFAULT NULL AFTER region;
