-- ============================================================
-- LeafScan AI - Switch from email login to username login
--
-- Changes:
--   users.username     NEW, unique, required - the login ID
--   users.email        now optional (kept for future use)
--   users.phone_number now required
--   farmers.address    NEW, replaces barangay
--
-- Steps are ordered so existing rows are never left invalid.
-- ============================================================

USE leafscan_ai;

-- ---------- 1. Add username as nullable first ----------
-- Adding it as NOT NULL immediately would fail, because
-- existing rows have no value to put in it.
ALTER TABLE users
    ADD COLUMN username VARCHAR(50) NULL AFTER full_name;

-- ---------- 2. Give existing users a username ----------
-- Uses the part of their email before the @ sign.
UPDATE users
SET username = SUBSTRING_INDEX(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- Fallback for any row with no email at all.
UPDATE users
SET username = CONCAT('user', id)
WHERE username IS NULL;

-- ---------- 3. Now make it required and unique ----------
ALTER TABLE users
    MODIFY COLUMN username VARCHAR(50) NOT NULL;

ALTER TABLE users
    ADD UNIQUE KEY uq_users_username (username);

-- ---------- 4. Email becomes optional ----------
-- MySQL allows many NULLs in a UNIQUE column, so the existing
-- unique index still works correctly.
ALTER TABLE users
    MODIFY COLUMN email VARCHAR(150) NULL;

-- ---------- 5. Phone number becomes required ----------
-- Fill in a placeholder for existing rows first.
UPDATE users
SET phone_number = '00000000000'
WHERE phone_number IS NULL OR phone_number = '';

ALTER TABLE users
    MODIFY COLUMN phone_number VARCHAR(20) NOT NULL;

-- ---------- 6. Add address to farmers ----------
ALTER TABLE farmers
    ADD COLUMN address VARCHAR(255) DEFAULT NULL AFTER user_id;

UPDATE farmers
SET address = barangay
WHERE barangay IS NOT NULL;