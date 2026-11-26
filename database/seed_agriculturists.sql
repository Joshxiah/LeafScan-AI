-- ============================================================
-- LeafScan AI - Seed a few agriculturists for demos
--
-- Real Pagadian City barangays, so the admin platform's Report
-- Details dropdown has something to show and can surface the
-- agriculturist whose service area matches the report's barangay.
-- An agriculturist's barangays live in agriculturist_barangays
-- (one row per barangay they cover).
--
-- Run AFTER add_agriculturists.sql and add_agriculturist_barangays.sql.
-- Re-runnable: each agriculturist is inserted only when one with that
-- name is absent, and the barangay rows use INSERT IGNORE.
-- ============================================================

USE leafscan_ai;

INSERT INTO agriculturists (full_name, phone_number, email, specialization)
SELECT 'Ernesto Bautista', '09171000001', 'ernesto.bautista@cao.pagadian.gov.ph',
       'Corn foliar diseases'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM agriculturists WHERE full_name = 'Ernesto Bautista');

INSERT INTO agriculturists (full_name, phone_number, email, specialization)
SELECT 'Marites Padilla', '09171000002', 'marites.padilla@cao.pagadian.gov.ph',
       'Integrated pest management'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM agriculturists WHERE full_name = 'Marites Padilla');

INSERT INTO agriculturists (full_name, phone_number, email, specialization)
SELECT 'Rodel Fernandez', '09171000003', 'rodel.fernandez@cao.pagadian.gov.ph',
       'Soil health and fertilization'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM agriculturists WHERE full_name = 'Rodel Fernandez');

INSERT INTO agriculturists (full_name, phone_number, email, specialization)
SELECT 'Grace Villaruz', '09171000004', 'grace.villaruz@cao.pagadian.gov.ph',
       'Crop extension and training'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM agriculturists WHERE full_name = 'Grace Villaruz');

-- Service areas.
INSERT IGNORE INTO agriculturist_barangays (agriculturist_id, barangay)
SELECT id, 'Balangasan' FROM agriculturists WHERE full_name = 'Ernesto Bautista';

INSERT IGNORE INTO agriculturist_barangays (agriculturist_id, barangay)
SELECT id, 'Santa Lucia' FROM agriculturists WHERE full_name = 'Marites Padilla';

INSERT IGNORE INTO agriculturist_barangays (agriculturist_id, barangay)
SELECT id, 'Tiguma' FROM agriculturists WHERE full_name = 'Rodel Fernandez';

INSERT IGNORE INTO agriculturist_barangays (agriculturist_id, barangay)
SELECT id, 'San Francisco' FROM agriculturists WHERE full_name = 'Grace Villaruz';

-- ============================================================
-- END
-- ============================================================
