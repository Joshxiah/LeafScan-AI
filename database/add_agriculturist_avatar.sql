-- ============================================================
-- LeafScan AI - Agriculturist profile photo support
--
-- Same convention as add_avatar.sql for users: stores the
-- RELATIVE path returned by POST /api/uploads (e.g.
-- "uploads/avatar-171234.jpg"), so the client builds the full
-- URL the same way it already does for user avatars.
-- ============================================================

USE leafscan_ai;

ALTER TABLE agriculturists
    ADD COLUMN avatar_path VARCHAR(255) DEFAULT NULL AFTER email;
