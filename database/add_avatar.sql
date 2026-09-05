-- ============================================================
-- LeafScan AI - Profile picture support
--
-- Stores the RELATIVE path (e.g. "uploads/avatar-171234.jpg"),
-- the same convention detections.image_path already uses, so the
-- client builds the full URL the same way for both: it just
-- prefixes the backend's base address.
-- ============================================================

USE leafscan_ai;

ALTER TABLE users
    ADD COLUMN avatar_path VARCHAR(255) DEFAULT NULL AFTER phone_number;
