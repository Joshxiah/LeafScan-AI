-- ============================================================
-- LeafScan AI - Per-purok farm plots
--
-- A farmer rarely works one square of land: a single barangay can
-- hold several plots ("luna") in different puroks, each a different
-- size, and a farmer may quote a small plot in square metres rather
-- than hectares. `farmers.farm_size_hectares` (one number) cannot
-- express that.
--
-- This adds `farm_plots` - many plots per farmer, each with its own
-- purok, the area exactly as the farmer stated it (value + unit),
-- and that same area normalised to hectares so plots can be summed.
-- `farmers.farm_size_hectares` is kept as a denormalised cache of
-- SUM(area_hectares) so every existing reader keeps working.
--
-- Run ONCE, after leafscan_ai_schema.sql. Safe to re-run: the table
-- create is IF NOT EXISTS and the backfill is guarded by NOT EXISTS.
-- ============================================================

USE leafscan_ai;

-- ------------------------------------------------------------
-- 1. farm_plots - one row per plot the farmer works
--
-- farmer_user_id points at users(id) (the same convention
-- detections.user_id and reports.farmer_id already use), not at
-- farmers.id, so a plot survives even before the farmers profile
-- row is written.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS farm_plots (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  farmer_user_id  INT UNSIGNED NOT NULL,
  purok           VARCHAR(100)  DEFAULT NULL,
  area_value      DECIMAL(10,2) NOT NULL,                 -- as the farmer stated it
  area_unit       ENUM('hectare','sqm') NOT NULL DEFAULT 'hectare',
  area_hectares   DECIMAL(12,4) NOT NULL,                 -- normalised: sqm / 10000
  note            VARCHAR(255)  DEFAULT NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_farm_plots_user (farmer_user_id),
  KEY idx_farm_plots_purok (purok),

  CONSTRAINT fk_farm_plots_user
    FOREIGN KEY (farmer_user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Backfill one plot per farmer from the old single number
--
-- Only for farmers who have a farm_size_hectares recorded AND do
-- not already have a plot (so re-running this does nothing).
-- ------------------------------------------------------------

INSERT INTO farm_plots (farmer_user_id, purok, area_value, area_unit, area_hectares)
SELECT f.user_id, NULL, f.farm_size_hectares, 'hectare', f.farm_size_hectares
FROM farmers f
WHERE f.farm_size_hectares IS NOT NULL
  AND f.farm_size_hectares > 0
  AND NOT EXISTS (
    SELECT 1 FROM farm_plots p WHERE p.farmer_user_id = f.user_id
  );

-- ============================================================
-- END
-- ============================================================
