-- ============================================================
-- LeafScan AI - Seed the first CAO administrator account
--
-- The register endpoint creates farmer accounts only, so the
-- first admin must be created directly. Run this ONCE.
--
-- ------------------------------------------------------------
-- DEV / THESIS LOGIN CREDENTIALS  (so they are easy to recall)
--
--     Admin URL : the admin-web app  ->  /login
--     Username  : admins
--     Password  : LeafScan@2026
--
-- The password_hash below is the bcrypt (cost 12) hash of that
-- password. To change the password later, run:
--     cd backend && node scripts/reset-admin-password.js "NewPass"
-- and paste the printed hash over the value below.
--
-- NOTE: this file is committed to Git, so this plaintext lives
-- in the repo history. Rotate the password before any real
-- deployment and move these notes out of version control.
-- ============================================================

USE leafscan_ai;

INSERT INTO users
    (full_name, username, email, phone_number, password_hash, role, is_active)
VALUES
    ('CAO Administrator',
     'admins',
     'admins@cao.pagadian.gov.ph',
     NULL,
     '$2b$12$rVGf91185L8r//aFjttKa.OrbvjCIsjYKC6uLTV/9Gs0FvAzHXKxi',
     'admin',
     1)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    is_active     = 1;
