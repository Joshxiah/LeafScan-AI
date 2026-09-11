-- ============================================================
-- LeafScan AI - Seed a few agriculturists for demos
--
-- Real Pagadian City barangays, so the admin platform's Report
-- Details dropdown has something to show and can surface the
-- agriculturist whose service area matches the report's barangay.
--
-- Run AFTER add_agriculturists.sql. Re-runnable: each row is
-- inserted only when an agriculturist with that name is absent.
-- ============================================================

USE leafscan_ai;

INSERT INTO agriculturists (full_name, phone_number, email, barangay, specialization)
SELECT 'Ernesto Bautista', '09171000001', 'ernesto.bautista@cao.pagadian.gov.ph',
       'Balangasan', 'Corn foliar diseases'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM agriculturists WHERE full_name = 'Ernesto Bautista');

INSERT INTO agriculturists (full_name, phone_number, email, barangay, specialization)
SELECT 'Marites Padilla', '09171000002', 'marites.padilla@cao.pagadian.gov.ph',
       'Santa Lucia', 'Integrated pest management'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM agriculturists WHERE full_name = 'Marites Padilla');

INSERT INTO agriculturists (full_name, phone_number, email, barangay, specialization)
SELECT 'Rodel Fernandez', '09171000003', 'rodel.fernandez@cao.pagadian.gov.ph',
       'Tiguma', 'Soil health and fertilization'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM agriculturists WHERE full_name = 'Rodel Fernandez');

INSERT INTO agriculturists (full_name, phone_number, email, barangay, specialization)
SELECT 'Grace Villaruz', '09171000004', 'grace.villaruz@cao.pagadian.gov.ph',
       'San Francisco', 'Crop extension and training'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM agriculturists WHERE full_name = 'Grace Villaruz');

-- ============================================================
-- END
-- ============================================================
