-- ============================================================
-- LeafScan AI - Cebuano translations for the Disease Library
--
-- The mobile app supports English and Cebuano. Until now the
-- disease reference content (names, descriptions, symptoms) and
-- the CAO's treatment recommendations were English-only, because
-- they come from the database rather than the app's i18n file.
--
-- This adds a parallel Cebuano column for every translatable text
-- field. GET /api/diseases?lang=ceb returns the Cebuano value when
-- present and falls back to English when it is not - so a treatment
-- the CAO adds later still shows (in English) until someone fills
-- in its *_ceb column.
--
-- scientific_name is deliberately NOT translated - it is a Latin
-- binomial and stays the same in every language.
--
-- The Cebuano below was written by Claude, not reviewed by a native
-- speaker. A City Agriculture Office agronomist should check it -
-- especially the treatment wording - before farmers rely on it.
--
-- Run ONCE, after seed_treatment_recommendations.sql. Re-runnable:
-- the column adds are guarded and the UPDATEs are idempotent.
-- ============================================================

USE leafscan_ai;

SET @db := DATABASE();

-- ------------------------------------------------------------
-- 1. diseases: Cebuano columns
-- ------------------------------------------------------------
SET @has := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'diseases' AND column_name = 'display_name_ceb'
);
SET @sql := IF(@has = 0,
  'ALTER TABLE diseases
     ADD COLUMN display_name_ceb VARCHAR(100) DEFAULT NULL AFTER display_name,
     ADD COLUMN description_ceb  TEXT DEFAULT NULL AFTER description,
     ADD COLUMN symptoms_ceb     TEXT DEFAULT NULL AFTER symptoms',
  'SELECT "diseases Cebuano columns already present"');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ------------------------------------------------------------
-- 2. treatment_recommendations: Cebuano columns
-- ------------------------------------------------------------
SET @has := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'treatment_recommendations' AND column_name = 'title_ceb'
);
SET @sql := IF(@has = 0,
  'ALTER TABLE treatment_recommendations
     ADD COLUMN title_ceb               VARCHAR(150) DEFAULT NULL AFTER title,
     ADD COLUMN recommendation_text_ceb TEXT DEFAULT NULL AFTER recommendation_text,
     ADD COLUMN application_method_ceb  TEXT DEFAULT NULL AFTER application_method,
     ADD COLUMN preventive_measures_ceb TEXT DEFAULT NULL AFTER preventive_measures',
  'SELECT "treatment_recommendations Cebuano columns already present"');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ------------------------------------------------------------
-- 3. Disease content - Cebuano
-- ------------------------------------------------------------
UPDATE diseases SET
  display_name_ceb = 'Kasagarang Taya',
  description_ceb = 'Usa ka sakit nga gikan sa fungus nga Puccinia sorghi. Motubo kini sa bugnaw ug umog nga panahon ug mokaylap pinaagi sa mga spore nga gidala sa hangin.',
  symptoms_ceb = 'Gagmay nga pula-pula ngadto sa brown nga mga bukol nga nagkatag sa ibabaw ug ilawom nga bahin sa dahon. Mobuto ang mga bukol ug mogawas ang pulbos nga spore.'
WHERE class_label = 'common_rust';

UPDATE diseases SET
  display_name_ceb = 'Abuhon nga Tulpok sa Dahon',
  description_ceb = 'Usa ka sakit nga gikan sa fungus nga Cercospora zeae-maydis. Gusto niini ang init ug umog nga panahon ug mabuhi kini sa nahabiling tuod sa mais sa uma.',
  symptoms_ceb = 'Pig-ot, rektanggulo nga tan ngadto sa abuhon nga mga samad nga tul-id og kilid ug parallel sa ugat sa dahon. Mahimong maghiusa ang mga samad ug modaot sa dako nga bahin sa dahon.'
WHERE class_label = 'gray_leaf_spot';

UPDATE diseases SET
  display_name_ceb = 'Himsog nga Dahon sa Mais',
  description_ceb = 'Walay nakita nga simtomas sa sakit. Morag himsog ang dahon.',
  symptoms_ceb = 'Parehas nga lunhaw nga kolor nga walay samad, tulpok, bukol, o patay nga tisyu.'
WHERE class_label = 'healthy';

UPDATE diseases SET
  display_name_ceb = 'Amihanang Pagkalaya sa Dahon',
  description_ceb = 'Usa ka sakit nga gikan sa fungus nga Exserohilum turcicum. Motubo kini sa kasarangang temperatura nga adunay taas nga panahon nga basa ang dahon.',
  symptoms_ceb = 'Taas, elliptical nga sama sa tabako nga porma nga abuhon-lunhaw ngadto sa tan nga mga samad, kasagaran pipila ka sentimetro ang gitas-on. Ang grabe nga impeksyon makapalaya sa tibuok dahon.'
WHERE class_label = 'northern_leaf_blight';

-- ------------------------------------------------------------
-- 4. Treatment recommendations - Cebuano
-- Matched by disease class + English title, so this stays correct
-- even if the recommendation ids differ between databases.
-- ------------------------------------------------------------

-- ----- common_rust -----
UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'common_rust'
SET tr.title_ceb = 'Paggamit og Fungicide',
    tr.recommendation_text_ceb = 'Pagbutang og triazole o strobilurin nga fungicide sa unang timailhan sa mga bukol, ug balika matag 7-10 ka adlaw samtang bugnaw ug umog pa ang panahon.',
    tr.application_method_ceb = 'Isprayan pag-ayo ang duha ka bahin sa dahon, sunod sa gidaghanon ug pre-harvest interval nga nakasulat sa label sa produkto.'
WHERE tr.title = 'Fungicide Application';

UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'common_rust'
SET tr.title_ceb = 'Mga Hybrid nga Lig-on Batok sa Sakit',
    tr.recommendation_text_ceb = 'Pagpili og mga hybrid nga mais nga lig-on batok sa taya para sa sunod nga tanom aron makunhoran ang kanunay nga paggamit og fungicide.',
    tr.preventive_measures_ceb = 'Ang mga barayti nga lig-on batok sa taya mao ang labing kasaligan nga dugay nga pamaagi sa pagpugong.'
WHERE tr.title = 'Resistant Hybrids';

UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'common_rust'
SET tr.title_ceb = 'Pagbantay sa Uma',
    tr.recommendation_text_ceb = 'Susiha ang mga dahon matag semana panahon sa bugnaw ug umog nga panahon, kung kanus-a pinakapaspas mokaylap ang taya, ug tambali dayon sa dili pa moabot ang mga bukol sa ibabaw nga bahin sa tanom.'
WHERE tr.title = 'Field Monitoring';

-- ----- gray_leaf_spot -----
UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'gray_leaf_spot'
SET tr.title_ceb = 'Pag-ilis-ilis sa Tanom',
    tr.recommendation_text_ceb = 'Pag-ilis og tanom nga dili host, sama sa munggos o gamot nga tanom, sulod sa labing menos usa ka tuig - mabuhi ang fungus sa nahabiling tuod sa mais.',
    tr.preventive_measures_ceb = 'Likayi ang pagtanom og mais human sa mais sa samang uma sa sunod-sunod nga panahon.'
WHERE tr.title = 'Crop Rotation' AND d.class_label = 'gray_leaf_spot';

UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'gray_leaf_spot'
SET tr.title_ceb = 'Pagdumala sa Nahabiling Tanom',
    tr.recommendation_text_ceb = 'Idaro o kuhaa ang nataptan nga mga salin sa tanom human sa ani aron makunhoran ang tinubdan sa spore para sa sunod nga tanom.'
WHERE tr.title = 'Residue Management';

UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'gray_leaf_spot'
SET tr.title_ceb = 'Paggamit og Fungicide',
    tr.recommendation_text_ceb = 'Kung grabe na, pagbutang og strobilurin nga fungicide dayon inig-abot sa mga samad, ilabina sa init ug umog nga panahon.',
    tr.application_method_ceb = 'I-iskedyul ang pag-ispray sa dili pa maghiusa ang mga samad ngadto sa dagko nga naguba nga bahin.'
WHERE tr.title = 'Fungicide Application' AND d.class_label = 'gray_leaf_spot';

-- ----- northern_leaf_blight -----
UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'northern_leaf_blight'
SET tr.title_ceb = 'Kuhaa ang Nataptan nga mga Dahon',
    tr.recommendation_text_ceb = 'Kuhaa ug gub-a ang grabe nga nataptan nga mga dahon kung mahimo aron mahinay ang pagkaylap sa spore ngadto sa himsog nga tisyu.'
WHERE tr.title = 'Remove Infected Leaves';

UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'northern_leaf_blight'
SET tr.title_ceb = 'Paggamit og Fungicide',
    tr.recommendation_text_ceb = 'Pagbutang og mancozeb o strobilurin nga fungicide matag 7-10 ka adlaw inig-abot sa mga samad, ilabina kung dugay nga basa ang mga dahon.',
    tr.application_method_ceb = 'Salupanan pag-ayo ang tibuok tanom ug balika human sa kusog nga ulan.'
WHERE tr.title = 'Fungicide Application' AND d.class_label = 'northern_leaf_blight';

UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'northern_leaf_blight'
SET tr.title_ceb = 'Pag-ilis-ilis sa Tanom',
    tr.recommendation_text_ceb = 'Pag-ilis og tanom nga dili host sa sunod nga panahon ug pilia ang mga hybrid nga lig-on kung balik-balik ang pagkalaya.'
WHERE tr.title = 'Crop Rotation' AND d.class_label = 'northern_leaf_blight';

UPDATE treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id AND d.class_label = 'northern_leaf_blight'
SET tr.title_ceb = 'Pangayo og Tabang sa Lokal',
    tr.recommendation_text_ceb = 'Konsultaha ang inyong lokal nga agricultural extension worker o ang City Agriculture Office kung grabe o paspas nga mokaylap ang impeksyon.'
WHERE tr.title = 'Seek Local Guidance';

-- ============================================================
-- END
-- ============================================================
