-- ============================================================
-- LeafScan AI - Make phone_number the reset identity
--
-- The mobile "Forgot password" flow now looks accounts up by
-- phone_number (no email involved anywhere in the system). A
-- shared number would make that lookup ambiguous, so it must be
-- unique the same way username already is.
--
-- Run this AFTER leafscan_ai_schema.sql. If it fails with a
-- duplicate-entry error, two existing rows share a number - fix
-- that row first (see the UPDATE below for an example), then
-- re-run.
-- ============================================================

USE leafscan_ai;

ALTER TABLE users
    ADD UNIQUE KEY uq_users_phone_number (phone_number);
