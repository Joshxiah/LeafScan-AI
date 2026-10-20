-- Renames the "Common Rust" class to "Southern Rust" (Puccinia polysora)
-- on an existing database. Fresh installs get this from leafscan_ai_schema.sql.
USE leafscan_ai;

UPDATE diseases SET
  class_label = 'southern_rust',
  display_name = 'Southern Rust',
  scientific_name = 'Puccinia polysora',
  description = 'A fungal disease of corn caused by Puccinia polysora. It develops in warm, humid conditions and spreads through airborne spores.',
  symptoms = 'Small, circular to oval orange to light-brown pustules clustered mostly on the upper leaf surface. Pustules rupture the leaf surface and release powdery orange spores.',
  display_name_ceb = 'Habagatang Taya',
  description_ceb = 'Usa ka sakit nga gikan sa fungus nga Puccinia polysora. Motubo kini sa init ug umog nga panahon ug mokaylap pinaagi sa mga spore nga gidala sa hangin.',
  symptoms_ceb = 'Gagmay, lingin ngadto sa oval nga orange ngadto sa light-brown nga mga bukol nga nagkatapok kasagaran sa ibabaw nga bahin sa dahon. Mobuto ang mga bukol ug mogawas ang pulbos nga spore.'
WHERE class_label = 'common_rust';

UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'southern_rust'
SET tr.recommendation_text = REPLACE(tr.recommendation_text, 'cool and humid', 'warm and humid'),
    tr.recommendation_text = REPLACE(tr.recommendation_text, 'cool, humid', 'warm, humid'),
    tr.recommendation_text_ceb = REPLACE(REPLACE(tr.recommendation_text_ceb, 'bugnaw ug umog', 'init ug umog'), 'bugnaw ug umog pa', 'init ug umog pa');

-- Existing scans / reports still store the old label; point them at the new one.
UPDATE detections SET predicted_class = 'southern_rust' WHERE predicted_class = 'common_rust';
UPDATE detections SET corrected_class = 'southern_rust' WHERE corrected_class = 'common_rust';
UPDATE report_images SET class_label = 'southern_rust' WHERE class_label = 'common_rust';
UPDATE reports SET disease_breakdown = REPLACE(REPLACE(disease_breakdown,
    '"classLabel":"common_rust"', '"classLabel":"southern_rust"'),
    '"displayName":"Common Rust"', '"displayName":"Southern Rust"')
WHERE disease_breakdown LIKE '%common_rust%';
