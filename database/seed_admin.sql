-- ============================================================
-- LeafScan AI - Seed the first CAO administrator account
--
-- The register endpoint creates farmer accounts only, so the
-- first admin must be created directly. Run this ONCE.
--
-- SECURITY NOTE: the hash below is a bcrypt hash, not a
-- password. It cannot be reversed. The plaintext password is
-- known only to the researchers and is not recorded here.
-- ============================================================

USE leafscan_ai;

INSERT INTO users
    (full_name, email, phone_number, password_hash, role, is_active)
VALUES
    ('CAO Administrator',
     'admins@cao.pagadian.gov.ph',
     NULL,
        '$2b$12$K4hRZ9mNpQ7vXsL2wYtCe.uJfB8dHnA5rTgM3xVkPzW6yE1oS4iDu',
     'admin',
     1);

