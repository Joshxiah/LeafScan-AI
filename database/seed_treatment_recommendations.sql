-- ============================================================
-- LeafScan AI - Starter treatment recommendations
--
-- treatment_recommendations is empty until the CAO publishes its
-- own guidance (see backend/src/services/disease.service.ts).
-- Until then, the Disease Library, disease detail screen, and the
-- post-scan Diagnosis screen have nothing real to show under
-- "Recommended Actions" / "Treatment".
--
-- These rows are standard, general-purpose IPM (integrated pest
-- management) guidance for the three diseases this system
-- detects - the kind found in agricultural-extension fact sheets -
-- NOT chemical dosages or CAO-vetted advice. They exist so the app
-- has real content to render instead of a placeholder. A City
-- Agriculture Office agronomist should review and replace these
-- before the app is used to advise real farmers.
-- ============================================================

USE leafscan_ai;

INSERT INTO treatment_recommendations
    (disease_id, title, recommendation_text, application_method, preventive_measures, is_active)
SELECT id, title, recommendation_text, application_method, preventive_measures, 1
FROM diseases
CROSS JOIN (
    SELECT 'common_rust' AS class_label, 'Fungicide Application' AS title,
           'Apply a triazole or strobilurin fungicide at the first sign of pustules, repeating every 7-10 days while conditions stay cool and humid.' AS recommendation_text,
           'Spray both leaf surfaces thoroughly, following the product label''s rate and pre-harvest interval.' AS application_method,
           NULL AS preventive_measures
    UNION ALL
    SELECT 'common_rust', 'Resistant Hybrids',
           'Choose rust-resistant corn hybrids for future plantings to reduce how often fungicide is needed.',
           NULL, 'Rust-resistant varieties are the most reliable long-term control.'
    UNION ALL
    SELECT 'common_rust', 'Field Monitoring',
           'Inspect leaves weekly during cool, humid weather, when rust spreads fastest, and treat early before pustules reach the upper canopy.',
           NULL, NULL

    UNION ALL
    SELECT 'gray_leaf_spot', 'Crop Rotation',
           'Rotate with a non-host crop, such as legumes or root crops, for at least one season - the fungus survives in leftover corn residue.',
           NULL, 'Avoid planting corn after corn in the same field for consecutive seasons.'
    UNION ALL
    SELECT 'gray_leaf_spot', 'Residue Management',
           'Plow under or remove infected crop debris after harvest to reduce the spore source for the next planting.',
           NULL, NULL
    UNION ALL
    SELECT 'gray_leaf_spot', 'Fungicide Application',
           'In severe cases, apply a strobilurin-based fungicide as soon as lesions appear, especially in warm, humid conditions.',
           'Time the spray before lesions merge into large blighted patches.', NULL

    UNION ALL
    SELECT 'northern_leaf_blight', 'Remove Infected Leaves',
           'Remove and destroy severely infected leaves where practical to slow the spread of spores to healthy tissue.',
           NULL, NULL
    UNION ALL
    SELECT 'northern_leaf_blight', 'Fungicide Application',
           'Apply a mancozeb or strobilurin fungicide every 7-10 days once lesions appear, particularly during extended periods of leaf wetness.',
           'Cover the whole canopy evenly and repeat after heavy rain.', NULL
    UNION ALL
    SELECT 'northern_leaf_blight', 'Crop Rotation',
           'Rotate with a non-host crop next season and favour resistant hybrids where blight recurs.',
           NULL, NULL
    UNION ALL
    SELECT 'northern_leaf_blight', 'Seek Local Guidance',
           'Consult your local agricultural extension worker or the City Agriculture Office if the infection is severe or spreading quickly.',
           NULL, NULL
) AS starter_guidance
WHERE diseases.class_label = starter_guidance.class_label;
