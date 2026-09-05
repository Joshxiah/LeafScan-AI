-- ============================================================
-- LeafScan AI - Password reset via emailed code
--
-- Adds the storage the "Forgot password" flow needs:
--   * a place to keep short-lived 6-digit reset codes
--   * nothing on the users table - it already has an `email`
--     column, which the mobile Create Account screen now fills in
--
-- Run this ONCE, after leafscan_ai_schema.sql.
-- ============================================================

USE leafscan_ai;

-- ---------- Reset codes ----------
-- One row per reset request. The code itself is NEVER stored -
-- only its SHA-256 hash - so a leak of this table cannot be used
-- to take over an account. Rows are disposable: expired and used
-- ones can be deleted at any time.
CREATE TABLE IF NOT EXISTS password_reset_codes (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id      INT UNSIGNED NOT NULL,
    code_hash    CHAR(64)     NOT NULL,           -- sha256 hex of the 6-digit code
    expires_at   DATETIME     NOT NULL,           -- request time + 15 minutes
    consumed_at  DATETIME     DEFAULT NULL,       -- set when the code is used
    attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- wrong tries, locked at 5
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_prc_user_id (user_id),
    KEY idx_prc_expires_at (expires_at),

    CONSTRAINT fk_prc_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
