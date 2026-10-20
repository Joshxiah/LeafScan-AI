-- ============================================================
-- LeafScan AI - Treatment control levels (IPM ladder)
--
-- Treatments are now graded by how severe the infection is, so a
-- farmer is not told to spray a fungicide for a few spotted leaves:
--
--   1. biological  (green)  - light infection, ~10-20% occurrence
--   2. mechanical  (yellow) - trim / remove infected leaves
--   3. cultural    (orange) - field sanitation, rotation, airflow
--   4. chemical    (red)    - ~50-60% damage (the IPM threshold);
--                             poisonous - follow the label
--
-- control_level is NULL for advice that is not a control step
-- (e.g. "Field Monitoring", "Resistant Varieties").
--
-- Also replaces the word "hybrid" with "variety" (Cebuano:
-- "barayti") everywhere in the treatment text.
--
-- The Cebuano below was written by Claude, not reviewed by a native
-- speaker - a CAO agronomist should check the wording, and confirm
-- the product example, before farmers rely on it.
--
-- Run ONCE after add_disease_translations.sql. Re-runnable: every
-- step is guarded or idempotent.
-- ============================================================

USE leafscan_ai;

SET @db := DATABASE();

-- ------------------------------------------------------------
-- 1. control_level column
-- ------------------------------------------------------------
SET @has := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'treatment_recommendations' AND column_name = 'control_level'
);
SET @sql := IF(@has = 0,
  'ALTER TABLE treatment_recommendations
     ADD COLUMN control_level ENUM(''biological'', ''mechanical'', ''cultural'', ''chemical'')
       DEFAULT NULL AFTER preventive_measures_ceb',
  'SELECT "control_level already present"');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ------------------------------------------------------------
-- 2. "hybrid" -> "variety" in every treatment text column
-- ------------------------------------------------------------
UPDATE treatment_recommendations SET
  title = REPLACE(REPLACE(REPLACE(REPLACE(title, 'Hybrids', 'Varieties'), 'hybrids', 'varieties'), 'Hybrid', 'Variety'), 'hybrid', 'variety'),
  recommendation_text = REPLACE(REPLACE(REPLACE(REPLACE(recommendation_text, 'Hybrids', 'Varieties'), 'hybrids', 'varieties'), 'Hybrid', 'Variety'), 'hybrid', 'variety'),
  application_method = REPLACE(REPLACE(REPLACE(REPLACE(application_method, 'Hybrids', 'Varieties'), 'hybrids', 'varieties'), 'Hybrid', 'Variety'), 'hybrid', 'variety'),
  preventive_measures = REPLACE(REPLACE(REPLACE(REPLACE(preventive_measures, 'Hybrids', 'Varieties'), 'hybrids', 'varieties'), 'Hybrid', 'Variety'), 'hybrid', 'variety'),
  title_ceb = REPLACE(REPLACE(title_ceb, 'Hybrid', 'Barayti'), 'hybrid', 'barayti'),
  recommendation_text_ceb = REPLACE(REPLACE(recommendation_text_ceb, 'Hybrid', 'Barayti'), 'hybrid', 'barayti'),
  application_method_ceb = REPLACE(REPLACE(application_method_ceb, 'Hybrid', 'Barayti'), 'hybrid', 'barayti'),
  preventive_measures_ceb = REPLACE(REPLACE(preventive_measures_ceb, 'Hybrid', 'Barayti'), 'hybrid', 'barayti');

-- ------------------------------------------------------------
-- 3. Grade the existing seeded rows
-- ------------------------------------------------------------
UPDATE treatment_recommendations SET control_level = 'chemical'
WHERE control_level IS NULL AND title = 'Fungicide Application';

UPDATE treatment_recommendations SET control_level = 'mechanical'
WHERE control_level IS NULL AND title = 'Remove Infected Leaves';

UPDATE treatment_recommendations SET control_level = 'cultural'
WHERE control_level IS NULL AND title IN ('Crop Rotation', 'Residue Management');

-- Chemical advice: state the threshold, an example, and the danger.
UPDATE treatment_recommendations SET
  recommendation_text = CONCAT(recommendation_text,
    ' Use chemicals only when damage reaches about 50-60% (the IPM threshold) and lighter controls are no longer enough. Example fungicide: Armure (difenoconazole + propiconazole). Chemicals are poisonous - wear gloves and a mask, and follow the label.'),
  recommendation_text_ceb = IF(recommendation_text_ceb IS NULL, NULL, CONCAT(recommendation_text_ceb,
    ' Gamita lang ang kemikal kung ang kadaot moabot na sa mga 50-60% (IPM threshold) ug dili na igo ang mas gaan nga pamaagi. Pananglitan nga fungicide: Armure (difenoconazole + propiconazole). Peligroso ang kemikal - magsuot og guwantes ug mask, ug sunda ang label.'))
WHERE control_level = 'chemical' AND recommendation_text NOT LIKE '%IPM threshold%';

-- Rust-resistant varieties: say what to plant and what to do if rust still shows.
UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'southern_rust'
SET tr.title = 'Resistant Varieties',
    tr.title_ceb = 'Mga Barayti nga Lig-on Batok sa Sakit',
    tr.recommendation_text = 'Plant rust-resistant corn varieties (rust-free varieties) in your next planting - this is the best long-term control. Ask the City Agriculture Office or your seed dealer which rust-resistant varieties are available in Pagadian, and check the seed label. If rust still appears on a resistant variety, use the control levels above according to how severe it is.',
    tr.recommendation_text_ceb = 'Pagtanom og mga barayti sa mais nga lig-on batok sa taya (rust-free nga barayti) sa sunod nga tanum - kini ang labing maayong dugay nga pagpugong. Pangutan-a ang City Agriculture Office o ang imong tigbaligya og binhi kung unsang mga barayti nga lig-on batok sa taya ang anaa sa Pagadian, ug tan-awa ang label sa binhi. Kung motungha gihapon ang taya sa lig-on nga barayti, gamita ang mga lebel sa pagpugong sa ibabaw sumala sa kalala niini.',
    tr.control_level = NULL
WHERE tr.title IN ('Resistant Hybrids', 'Resistant Varieties');

-- ------------------------------------------------------------
-- 4. Fill in any missing level for each diseased class
-- ------------------------------------------------------------
INSERT INTO treatment_recommendations
    (disease_id, title, title_ceb, recommendation_text, recommendation_text_ceb,
     application_method, application_method_ceb, control_level, is_active)
SELECT d.id, lv.title, lv.title_ceb, lv.text_en, lv.text_ceb,
       lv.method_en, lv.method_ceb, lv.level, 1
FROM diseases d
CROSS JOIN (
    SELECT 'biological' AS level,
           'Biological Control' AS title,
           'Biological nga Pagpugong' AS title_ceb,
           'For light infection (about 10-20% of the plants or leaf area affected), use a Trichoderma-based biological fungicide. This is the first thing to try.' AS text_en,
           'Alang sa gamay pa nga sakit (mga 10-20% sa tanom o dahon ang apektado), gamita ang biological fungicide nga adunay Trichoderma. Kini ang unang sulayan.' AS text_ceb,
           'Spray the leaves in the early morning or late afternoon and repeat every 7-10 days, as directed on the product label.' AS method_en,
           'Isprayan ang mga dahon sa buntag o hapon ug balika matag 7-10 ka adlaw, sumala sa nakasulat sa label.' AS method_ceb
    UNION ALL
    SELECT 'mechanical',
           'Mechanical Control',
           'Mekanikal nga Pagpugong',
           'For moderate infection, trim off and remove the infected leaves, then destroy them away from the field (burn or bury) so spores do not spread.',
           'Alang sa kasarangan nga sakit, putlai ug kuhaa ang mga dahon nga naay sakit, unya gub-a o ilubong sa gawas sa uma aron dili mokaylap ang mga spora.',
           'Use clean, sharp shears and wash them between plants.',
           'Gamita ang limpyo ug hait nga gunting ug hugasi kini sa matag tanom.'
    UNION ALL
    SELECT 'cultural',
           'Cultural Control',
           'Kultural nga Pagpugong',
           'Keep the field clean: clear weeds and bury or remove crop residue, rotate with a non-host crop, and give plants enough space for airflow.',
           'Limpyohi ang uma: tangtanga ang sagbot, ilubong o kuhaa ang salin sa tanom, pag-ilis og tanom nga dili host, ug hatagi og igo nga luna ang tanom aron makaagi ang hangin.',
           'Water at the base of the plants in the morning, not over the leaves late in the day.',
           'Tubigi ang ubos sa tanom sa buntag, dili ang mga dahon sa hapon o gabii.'
    UNION ALL
    SELECT 'chemical',
           'Fungicide Application',
           'Paggamit og Fungicide',
           'Use chemicals only when damage reaches about 50-60% (the IPM threshold) and lighter controls are no longer enough. Example fungicide: Armure (difenoconazole + propiconazole). Chemicals are poisonous - wear gloves and a mask, and follow the label.',
           'Gamita lang ang kemikal kung ang kadaot moabot na sa mga 50-60% (IPM threshold) ug dili na igo ang mas gaan nga pamaagi. Pananglitan nga fungicide: Armure (difenoconazole + propiconazole). Peligroso ang kemikal - magsuot og guwantes ug mask, ug sunda ang label.',
           'Follow the label rate and the pre-harvest interval.',
           'Sunda ang gidaghanon ug pre-harvest interval nga nakasulat sa label.'
) AS lv
WHERE d.is_healthy = 0
  AND NOT EXISTS (
    SELECT 1 FROM treatment_recommendations x
    WHERE x.disease_id = d.id AND x.control_level = lv.level
  );
