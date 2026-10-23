-- ============================================================
-- LeafScan AI - Revised disease content and treatment ladder
--
-- Replaces the description, symptoms and starter treatments for
-- Southern Rust, Northern Leaf Blight and Gray Leaf Spot with the
-- revised, DA-based farmer guidance (English + Cebuano).
--
-- The treatment ladder changes from
--   biological -> mechanical -> cultural -> chemical
-- to
--   1. prevention  (green)  - resistant varieties
--   2. cultural    (yellow) - rotation, residue, plant health
--   3. monitoring  (orange) - regular field checks
--   4. chemical    (red)    - FPA-registered fungicide; poisonous
--
-- "Favorable conditions" and "Impact" have no columns of their own;
-- they are appended to description as separate paragraphs.
--
-- Only the starter rows (created_by IS NULL) are replaced. Rows the
-- CAO wrote from the admin platform are kept: their "mechanical"
-- level becomes "cultural", and "biological" is cleared so the CAO
-- can re-grade them.
--
-- The Cebuano below was written by Claude, not reviewed by a native
-- speaker - a CAO agronomist should check the wording before
-- farmers rely on it.
--
-- Run ONCE after add_treatment_control_levels.sql. Re-runnable.
-- ============================================================

USE leafscan_ai;
SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 1. New control-level ladder
-- ------------------------------------------------------------
ALTER TABLE treatment_recommendations
  MODIFY COLUMN control_level
    ENUM('biological', 'mechanical', 'prevention', 'cultural', 'monitoring', 'chemical')
    DEFAULT NULL;

UPDATE treatment_recommendations SET control_level = 'cultural' WHERE control_level = 'mechanical';
UPDATE treatment_recommendations SET control_level = NULL WHERE control_level = 'biological';

ALTER TABLE treatment_recommendations
  MODIFY COLUMN control_level
    ENUM('prevention', 'cultural', 'monitoring', 'chemical')
    DEFAULT NULL;

-- ------------------------------------------------------------
-- 2. Disease content
-- ------------------------------------------------------------
UPDATE diseases SET
  scientific_name = 'Puccinia polysora',
  description = CONCAT(
    'Southern rust, also called corn rust, is a fungal disease of corn caused by Puccinia polysora. The fungus needs living corn tissue to survive, so it does not survive in dead crop debris. Its spores are spread by wind and rain from rust pustules. It can attack corn at the seedling, vegetative, flowering, and fruiting stages. In the Philippines, an outbreak in 1953 reduced yields by 80-84%.',
    '\n\nFavorable conditions:',
    '\nWarm temperatures of about 20–30 °C. This disease is more common in tropical lowlands like Pagadian than in cool highlands.',
    '\nHigh humidity and frequent rain. In the Philippines, the rainy season is the main risk period.',
    '\nWind. Spores can travel far between fields, so a clean field can still get infected from a neighbor’s field.',
    '\nLate planting. Young leaves are more susceptible, so fields planted late in the season are more at risk.',
    '\n\nImpact: Rust reduces the leaf area that makes food (photosynthesis). This leads to poorly filled kernels, weak stalks that can fall over (lodging), and lower yield.'),
  symptoms = CONCAT(
    'Round, light green to yellow spots that develop into small round to oval pustules with orange to cinnamon-brown spores, densely scattered mostly on the upper leaf surface.',
    '\nPustules can also appear on husks, leaf sheaths, ear shanks, and stalks.',
    '\nInfected leaves dry up early.'),
  description_ceb = CONCAT(
    'Ang habagatang taya, gitawag usab og taya sa mais, usa ka sakit sa mais nga gikan sa fungus nga Puccinia polysora. Kinahanglan sa fungus ang buhi nga tisyu sa mais aron mabuhi, busa dili kini mabuhi sa patay nga salin sa tanom. Ang mga spore niini gidala sa hangin ug ulan gikan sa mga bukol sa taya. Makatakod kini sa mais sukad sa semilya, sa pagtubo, sa pagpamulak, hangtod sa pagpamunga. Sa Pilipinas, usa ka outbreak niadtong 1953 ang nakapakunhod sa ani og 80-84%.',
    '\n\nKahimtang nga paborable sa sakit:',
    '\nInit nga temperatura nga mga 20–30 °C. Mas kasagaran kini nga sakit sa tropikal nga ubos nga mga lugar sama sa Pagadian kaysa sa bugnaw nga kabukiran.',
    '\nTaas nga umog ug kanunay nga ulan. Sa Pilipinas, ang tag-ulan mao ang panahon nga pinakadelikado.',
    '\nHangin. Makabiyahe og layo ang mga spore tali sa mga uma, busa ang limpyo nga uma mahimo gihapong mataptan gikan sa uma sa silingan.',
    '\nUlahing pagtanom. Mas dali mataptan ang bata nga mga dahon, busa mas delikado ang mga uma nga gitanom sa ulahing bahin sa panahon.',
    '\n\nEpekto: Gipakunhod sa taya ang bahin sa dahon nga mohimo og pagkaon (photosynthesis). Tungod niini, dili mapuno pag-ayo ang mga lugas, maluya ang lawas sa tanom ug mahimong matumba (lodging), ug mokunhod ang ani.'),
  symptoms_ceb = CONCAT(
    'Lingin, light green ngadto sa dalag nga mga tulpok nga mahimong gagmay, lingin ngadto sa oval nga mga bukol nga adunay orange ngadto sa cinnamon-brown nga spore, dasok nga nagkatag kasagaran sa ibabaw nga bahin sa dahon.',
    '\nMahimo usab motungha ang mga bukol sa panit sa puso, sa sapaw sa dahon, sa tangkay sa puso, ug sa lawas sa tanom.',
    '\nSayo nga mamala ang nataptan nga mga dahon.')
WHERE class_label = 'southern_rust';

UPDATE diseases SET
  scientific_name = 'Exserohilum turcicum',
  description = CONCAT(
    'Northern leaf blight is a fungal disease of corn caused by Exserohilum turcicum, also known as Setosphaeria turcica or Helminthosporium turcicum. It is one of the common corn diseases in the Philippines listed by the Department of Agriculture. It causes long, cigar-shaped spots on the leaves and can make the leaves dry up early, even while the corn is still young.',
    '\n\nFavorable conditions:',
    '\nLong periods of wet, cloudy, humid weather. In the Philippines, this is the rainy season.',
    '\nModerate temperatures of about 18–30 °C. Cooler, higher-elevation farms and cool rainy days carry more risk.',
    '\nPlanting corn after corn without rotation, and minimum tillage that leaves old corn debris on the surface.',
    '\nInfected leftover corn plants in the field. The fungus survives there, and rain splash and wind spread its spores.'),
  symptoms = CONCAT(
    'Long, oval (elliptical), grayish-green spots on the leaf, about 20 mm long and 5 mm wide, shaped like a cigarette.',
    '\nLeaves dry up early, even when the corn is still young.',
    '\nSmall black dots appear on the dried parts of the leaf.',
    '\nSpots appear first on the lower leaves.'),
  description_ceb = CONCAT(
    'Ang northern leaf blight usa ka sakit sa mais nga gikan sa fungus nga Exserohilum turcicum, nailhan usab nga Setosphaeria turcica o Helminthosporium turcicum. Usa kini sa kasagarang sakit sa mais sa Pilipinas nga gilista sa Department of Agriculture. Mohimo kini og tag-as, porma og tabako nga mga tulpok sa dahon ug makapamala sa mga dahon og sayo, bisan bata pa ang mais.',
    '\n\nKahimtang nga paborable sa sakit:',
    '\nDugay nga basa, madag-om, ug umog nga panahon. Sa Pilipinas, kini mao ang tag-ulan.',
    '\nKasarangang temperatura nga mga 18–30 °C. Mas delikado ang bugnaw nga mga uma sa taas nga lugar ug ang bugnaw nga mga adlaw nga ulan.',
    '\nPagtanom og mais human sa mais nga walay rotation, ug minimum tillage nga mobiya sa daan nga salin sa mais sa ibabaw sa yuta.',
    '\nNataptan nga salin sa tanom nga mais sa uma. Didto mabuhi ang fungus, ug ang mga spore niini gikatag sa tumpak sa ulan ug sa hangin.'),
  symptoms_ceb = CONCAT(
    'Taas, oval (elliptical), abuhon-lunhaw nga mga tulpok sa dahon, mga 20 mm ang gitas-on ug 5 mm ang gilapdon, porma og sigarilyo.',
    '\nSayo nga mamala ang mga dahon, bisan bata pa ang mais.',
    '\nMotungha ang gagmay nga itom nga tuldok sa namala nga bahin sa dahon.',
    '\nUna nga motungha ang mga tulpok sa ubos nga mga dahon.')
WHERE class_label = 'northern_leaf_blight';

UPDATE diseases SET
  scientific_name = 'Cercospora zeae-maydis',
  description = CONCAT(
    'Gray leaf spot is a fungal disease of corn caused by Cercospora zeae-maydis. The Department of Agriculture lists it as one of the common corn diseases in the Philippines. The fungus survives on infected corn leaves left in the field. It can affect corn at the vegetative, flowering, and fruiting stages.',
    '\n\nFavorable conditions:',
    '\nWarm temperatures of 22–30 °C. These are common in Philippine lowlands most of the year.',
    '\nVery high humidity (above 90%) and long periods of wet leaves from rain, dew, or irrigation. Risk is highest in the rainy season.',
    '\nInfected corn leaves left on the soil, especially when farmers plant corn after corn without rotation.',
    '\nCrowded planting that keeps leaves wet longer.'),
  symptoms = CONCAT(
    'Small pin-point spots surrounded by a yellow halo.',
    '\nThe spots grow into long, narrow, rectangular lesions bounded by the leaf veins, running parallel to them, on both sides of the leaf.',
    '\nLesions can merge and kill large parts of the leaf.',
    '\nSevere infection causes early drying, weak or broken stalks, and poorly filled ears.'),
  description_ceb = CONCAT(
    'Ang gray leaf spot usa ka sakit sa mais nga gikan sa fungus nga Cercospora zeae-maydis. Gilista kini sa Department of Agriculture isip usa sa kasagarang sakit sa mais sa Pilipinas. Mabuhi ang fungus sa nataptan nga mga dahon sa mais nga nahabilin sa uma. Makatakod kini sa mais sa pagtubo, pagpamulak, ug pagpamunga.',
    '\n\nKahimtang nga paborable sa sakit:',
    '\nInit nga temperatura nga 22–30 °C. Kasagaran kini sa ubos nga mga lugar sa Pilipinas sa kadaghanang bahin sa tuig.',
    '\nTaas kaayo nga umog (labaw sa 90%) ug dugay nga pagkabasa sa dahon tungod sa ulan, yamog, o patubig. Pinakadelikado sa tag-ulan.',
    '\nNataptan nga mga dahon sa mais nga nahabilin sa yuta, labi na kung motanom ang mga mag-uuma og mais human sa mais nga walay rotation.',
    '\nDasok nga pagtanom nga maghimo nga mas dugay mabasa ang mga dahon.'),
  symptoms_ceb = CONCAT(
    'Gagmay kaayo nga mga tulpok nga gilibutan og dalag nga halo.',
    '\nMotubo ang mga tulpok ngadto sa taas, pig-ot, rektanggulo nga mga samad nga gilimitahan sa ugat sa dahon ug parallel niini, sa duha ka kilid sa dahon.',
    '\nMahimong maghiusa ang mga samad ug mopatay sa dagkong bahin sa dahon.',
    '\nAng grabe nga impeksyon mosangpot sa sayo nga pagkamala, maluya o mabali nga lawas sa tanom, ug dili mapuno nga mga puso.')
WHERE class_label = 'gray_leaf_spot';

-- ------------------------------------------------------------
-- 3. Replace the starter treatments
-- ------------------------------------------------------------
DELETE tr FROM treatment_recommendations tr
JOIN diseases d ON d.id = tr.disease_id
WHERE tr.created_by IS NULL
  AND d.class_label IN ('southern_rust', 'northern_leaf_blight', 'gray_leaf_spot');

INSERT INTO treatment_recommendations
    (disease_id, title, title_ceb, recommendation_text, recommendation_text_ceb,
     control_level, is_active)
SELECT d.id, g.title, g.title_ceb, g.text_en, g.text_ceb, g.level, 1
FROM diseases d
JOIN (
    -- ----- southern_rust -----
    SELECT 1 AS sort, 'southern_rust' AS class_label, 'prevention' AS level,
           'Resistant Varieties' AS title,
           'Mga Barayti nga Lig-on Batok sa Sakit' AS title_ceb,
           'Plant a rust-resistant corn variety. This is the main recommended control. Ask the City Agriculture Office which resistant varieties are available in Pagadian.' AS text_en,
           'Pagtanom og barayti sa mais nga lig-on batok sa taya. Kini ang pangunang girekomendar nga pagpugong. Pangutan-a ang City Agriculture Office kung unsang mga barayti nga lig-on ang anaa sa Pagadian.' AS text_ceb
    UNION ALL
    SELECT 2, 'southern_rust', 'cultural',
           'Good Farm Practices',
           'Maayong Pamaagi sa Pag-uma',
           'Use good-quality seed, plant during the recommended season, use proper plant spacing, and keep the field clean. Follow the advice of your agricultural technologist.',
           'Gamita ang maayong klase sa binhi, pagtanom sa girekomendar nga panahon, gamita ang sakto nga gilay-on sa tanom, ug limpyohi ang uma. Sunda ang tambag sa inyong agricultural technologist.'
    UNION ALL
    SELECT 3, 'southern_rust', 'monitoring',
           'Field Monitoring',
           'Pagbantay sa Uma',
           'Check your corn regularly for orange-brown pustules on the upper leaf surface, especially during warm, rainy weather. Early detection matters because fungicides work best before the disease spreads.',
           'Susiha kanunay ang inyong mais kung adunay orange-brown nga mga bukol sa ibabaw nga bahin sa dahon, ilabina sa init ug ulanon nga panahon. Importante ang sayo nga pagkakita kay mas epektibo ang fungicide sa dili pa mokaylap ang sakit.'
    UNION ALL
    SELECT 4, 'southern_rust', 'chemical',
           'Fungicide Application',
           'Paggamit og Fungicide',
           'If rust appears, spray early, before it spreads through the whole plant and before the corn is near maturity. Fungicides containing propiconazole, pyraclostrobin, picoxystrobin, azoxystrobin, trifloxystrobin, or prothioconazole (alone or combined) can be used. Use only products registered by the FPA for rust on corn. Fungicides are poisonous: wear gloves and a mask, and follow the label.',
           'Kung motungha ang taya, pag-ispray dayon, sa dili pa kini mokaylap sa tibuok tanom ug sa dili pa hapit mahinog ang mais. Mahimong gamiton ang fungicide nga adunay propiconazole, pyraclostrobin, picoxystrobin, azoxystrobin, trifloxystrobin, o prothioconazole (usa ra o gisagol). Gamita lang ang mga produkto nga rehistrado sa FPA alang sa taya sa mais. Peligroso ang fungicide: magsuot og guwantes ug mask, ug sunda ang label.'
    UNION ALL
    SELECT 5, 'southern_rust', NULL,
           'Seek Local Guidance',
           'Pangayo og Tabang sa Lokal',
           'Consult your agricultural extension worker or the City Agriculture Office if the infection is severe or spreading quickly.',
           'Konsultaha ang inyong agricultural extension worker o ang City Agriculture Office kung grabe o paspas nga mokaylap ang impeksyon.'

    -- ----- northern_leaf_blight -----
    UNION ALL
    SELECT 1, 'northern_leaf_blight', 'prevention',
           'Resistant Varieties',
           'Mga Barayti nga Lig-on Batok sa Sakit',
           'Plant corn varieties resistant to leaf blight. This is the best and cheapest way to control the disease. Ask the City Agriculture Office which resistant varieties are available in Pagadian.',
           'Pagtanom og mga barayti sa mais nga lig-on batok sa leaf blight. Kini ang labing maayo ug labing barato nga paagi sa pagpugong sa sakit. Pangutan-a ang City Agriculture Office kung unsang mga barayti nga lig-on ang anaa sa Pagadian.'
    UNION ALL
    SELECT 2, 'northern_leaf_blight', 'cultural',
           'Crop Rotation',
           'Pag-ilis-ilis sa Tanom',
           'Rotate with a non-host crop such as soybean to lower the chance of the disease coming back.',
           'Pag-ilis og tanom nga dili host sama sa soybean aron makunhoran ang posibilidad nga mobalik ang sakit.'
    UNION ALL
    SELECT 3, 'northern_leaf_blight', 'cultural',
           'Keep Plants Healthy',
           'Atimana nga Himsog ang Tanom',
           'Apply the right fertilizer and control pests so the corn is less stressed and stays strong.',
           'Gamita ang sakto nga abono ug pugngi ang mga peste aron dili ma-stress ang mais ug magpabiling lig-on.'
    UNION ALL
    SELECT 4, 'northern_leaf_blight', 'monitoring',
           'Field Monitoring',
           'Pagbantay sa Uma',
           'Check the field regularly, starting with the lower leaves, and learn to recognize the symptoms early.',
           'Susiha kanunay ang uma, sugod sa ubos nga mga dahon, ug kat-oni ang pag-ila sa mga simtomas og sayo.'
    UNION ALL
    SELECT 5, 'northern_leaf_blight', 'chemical',
           'Fungicide Application',
           'Paggamit og Fungicide',
           'Use a fungicide registered by the FPA for northern leaf blight on corn, for example Etiage SC 300. DA mainly recommends spraying in fields grown for seed production. Ask the CAO before buying. Fungicides are poisonous: wear gloves and a mask, and follow the label.',
           'Gamita ang fungicide nga rehistrado sa FPA alang sa northern leaf blight sa mais, pananglitan ang Etiage SC 300. Kasagaran girekomendar sa DA ang pag-ispray sa mga uma nga gitamnan alang sa binhi. Pangutana sa CAO sa dili pa mopalit. Peligroso ang fungicide: magsuot og guwantes ug mask, ug sunda ang label.'
    UNION ALL
    SELECT 6, 'northern_leaf_blight', NULL,
           'Seek Local Guidance',
           'Pangayo og Tabang sa Lokal',
           'Consult your agricultural extension worker or the City Agriculture Office if the infection is severe or spreading quickly.',
           'Konsultaha ang inyong agricultural extension worker o ang City Agriculture Office kung grabe o paspas nga mokaylap ang impeksyon.'

    -- ----- gray_leaf_spot -----
    UNION ALL
    SELECT 1, 'gray_leaf_spot', 'prevention',
           'Resistant Varieties',
           'Mga Barayti nga Lig-on Batok sa Sakit',
           'Plant corn varieties resistant to gray leaf spot. This is the most effective control. Ask the City Agriculture Office which resistant varieties are available in Pagadian.',
           'Pagtanom og mga barayti sa mais nga lig-on batok sa gray leaf spot. Kini ang labing epektibo nga pagpugong. Pangutan-a ang City Agriculture Office kung unsang mga barayti nga lig-on ang anaa sa Pagadian.'
    UNION ALL
    SELECT 2, 'gray_leaf_spot', 'cultural',
           'Crop Rotation',
           'Pag-ilis-ilis sa Tanom',
           'Rotate with a non-host crop such as soybean or other legumes.',
           'Pag-ilis og tanom nga dili host sama sa soybean o ubang mga legume.'
    UNION ALL
    SELECT 3, 'gray_leaf_spot', 'cultural',
           'Residue Management',
           'Pagdumala sa Nahabiling Tanom',
           'After harvest, plow under or remove leftover corn leaves and stalks so the fungus has nowhere to survive, except in areas where the soil erodes easily.',
           'Human sa ani, idaro o kuhaa ang nahabiling mga dahon ug lawas sa mais aron walay kabuhian ang fungus, gawas sa mga lugar nga dali ma-erosion ang yuta.'
    UNION ALL
    SELECT 4, 'gray_leaf_spot', 'cultural',
           'Keep Plants Healthy',
           'Atimana nga Himsog ang Tanom',
           'Apply balanced fertilizer and control pests so the corn is less stressed. Avoid planting too densely, so air can move and leaves dry faster.',
           'Gamita ang balanse nga abono ug pugngi ang mga peste aron dili ma-stress ang mais. Ayaw pagtanom og dasok kaayo aron makaagi ang hangin ug dali mamala ang mga dahon.'
    UNION ALL
    SELECT 5, 'gray_leaf_spot', 'monitoring',
           'Field Monitoring',
           'Pagbantay sa Uma',
           'Check the field regularly, especially during long rainy or humid periods.',
           'Susiha kanunay ang uma, ilabina sa dugay nga ulanon o umog nga panahon.'
    UNION ALL
    SELECT 6, 'gray_leaf_spot', 'chemical',
           'Fungicide Application',
           'Paggamit og Fungicide',
           'If the disease is spreading, spray a fungicide recommended by your agricultural technologist. Use only FPA-registered products for corn, and ask the City Agriculture Office before buying. Fungicides are poisonous: wear gloves and a mask, and follow the label.',
           'Kung nagkaylap ang sakit, pag-ispray og fungicide nga girekomendar sa inyong agricultural technologist. Gamita lang ang mga produkto nga rehistrado sa FPA alang sa mais, ug pangutana sa City Agriculture Office sa dili pa mopalit. Peligroso ang fungicide: magsuot og guwantes ug mask, ug sunda ang label.'
    UNION ALL
    SELECT 7, 'gray_leaf_spot', NULL,
           'Seek Local Guidance',
           'Pangayo og Tabang sa Lokal',
           'Consult your agricultural extension worker or the City Agriculture Office if the infection is severe or spreading quickly.',
           'Konsultaha ang inyong agricultural extension worker o ang City Agriculture Office kung grabe o paspas nga mokaylap ang impeksyon.'
) AS g ON g.class_label = d.class_label
ORDER BY d.id, g.sort;

-- ============================================================
-- END
-- ============================================================
