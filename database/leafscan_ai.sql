-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 06, 2026 at 06:30 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `leafscan_ai`
--

-- --------------------------------------------------------

--
-- Table structure for table `agriculturists`
--

CREATE TABLE `agriculturists` (
  `id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `avatar_path` varchar(255) DEFAULT NULL,
  `barangay` varchar(150) DEFAULT NULL,
  `municipality` varchar(100) DEFAULT 'Pagadian City',
  `specialization` varchar(150) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `agriculturists`
--

INSERT INTO `agriculturists` (`id`, `full_name`, `phone_number`, `email`, `avatar_path`, `barangay`, `municipality`, `specialization`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Ernesto Bautista', '09171000001', 'ernesto.bautista@cao.pagadian.gov.ph', 'uploads/1789584634030-cfee2e15-7f9c-451b-aed3-bc7c022ed495.jpg', NULL, 'Pagadian City', 'Corn foliar diseases', 1, '2026-09-08 07:24:06', '2026-09-22 03:01:59'),
(4, 'Grace Villaruz', '09171000004', 'grace.villaruz@cao.pagadian.gov.ph', 'uploads/1789584691059-ef8651a3-0b4e-446f-ba2c-b28a354eac38.jpg', NULL, 'Pagadian City', 'Crop extension and training', 1, '2026-09-08 07:24:06', '2026-09-16 18:51:34'),
(5, 'Jhoana Marie Sumalpong', '09876543211', 'name@gmail.com', 'uploads/1789584609475-527f2e91-df67-4001-a895-7489494307da.webp', NULL, 'Pagadian City', NULL, 1, '2026-09-08 07:43:44', '2026-09-16 18:50:10');

-- --------------------------------------------------------

--
-- Table structure for table `backup_20261011_treatment_recommendations`
--

CREATE TABLE `backup_20261011_treatment_recommendations` (
  `id` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `disease_id` int(10) UNSIGNED NOT NULL,
  `control_type` enum('cultural','mechanical','biological','chemical','resistant_variety') DEFAULT NULL,
  `toxicity_category` enum('I','II','III','IV') DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `title_ceb` varchar(150) DEFAULT NULL,
  `recommendation_text` text NOT NULL,
  `recommendation_text_ceb` text DEFAULT NULL,
  `application_method` text DEFAULT NULL,
  `application_method_ceb` text DEFAULT NULL,
  `preventive_measures` text DEFAULT NULL,
  `preventive_measures_ceb` text DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `spidtech_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `backup_20261011_treatment_recommendations`
--

INSERT INTO `backup_20261011_treatment_recommendations` (`id`, `disease_id`, `control_type`, `toxicity_category`, `title`, `title_ceb`, `recommendation_text`, `recommendation_text_ceb`, `application_method`, `application_method_ceb`, `preventive_measures`, `preventive_measures_ceb`, `created_by`, `is_active`, `spidtech_verified`, `created_at`, `updated_at`) VALUES
(1, 1, 'cultural', NULL, 'Field Monitoring', 'Pagbantay sa Uma', 'Inspect leaves weekly during cool, humid weather, when rust spreads fastest, and treat early before pustules reach the upper canopy.', 'Susiha ang mga dahon matag semana panahon sa bugnaw ug umog nga panahon, kung kanus-a pinakapaspas mokaylap ang taya, ug tambali dayon sa dili pa moabot ang mga bukol sa ibabaw nga bahin sa tanom.', NULL, NULL, NULL, NULL, NULL, 1, 0, '2026-09-05 02:46:32', '2026-10-07 11:13:39'),
(2, 1, 'resistant_variety', NULL, 'Resistant Varieties', 'Mga Barayti nga Lig-on Batok sa Sakit', 'Plant a corn variety rated resistant (\"rust-free\") to common rust in your next planting. Ask the City Agriculture Office which resistant varieties are available in Pagadian.', 'Sa sunod nga pagtanom, gamita ang barayti sa mais nga lig-on batok sa taya (\"rust-free\"). Pangutana sa City Agriculture Office kung unsang mga lig-on nga barayti ang anaa sa Pagadian.', NULL, NULL, 'Resistant varieties are the most reliable and cheapest long-term control - they reduce how often any spray is needed.', 'Ang lig-on nga barayti mao ang labing kasaligan ug labing barato nga paagi sa dugay nga pagpugong - makunhoran ang kinahanglan nga pag-spray.', NULL, 1, 0, '2026-09-05 02:46:32', '2026-10-07 11:13:39'),
(3, 1, 'chemical', NULL, 'Fungicide Application', 'Paggamit og Fungicide', 'Use a fungicide only as a LAST resort: when about 50-60% of plants are damaged (the IPM action threshold) and field sanitation, leaf trimming and biological control have not held the disease. Choose a fungicide registered with the FPA for corn - for example one containing propiconazole, azoxystrobin or pyraclostrobin - and ask the City Agriculture Office before buying.', 'Gamita lang ang fungicide isip KATAPUSAN nga paagi: kung mga 50-60% na sa mga tanom ang nadaot (ang IPM action threshold) ug wala na makapugong ang paglimpyo sa uma, pagtangtang sa dahon ug biological control. Pagpili og fungicide nga rehistrado sa FPA alang sa mais - pananglitan nga adunay propiconazole, azoxystrobin o pyraclostrobin - ug pangutana una sa City Agriculture Office sa dili pa mopalit.', 'Follow the product label exactly: rate, re-spray interval and the days to wait before harvest. Wear gloves, a mask and long sleeves. Check the colour band at the bottom of the label - green is least toxic, then blue, then yellow; red-label pesticides are banned.', 'Sunda gyud ang label sa produkto: ang sukod, ang gintang sa pag-spray, ug ang mga adlaw nga hulaton sa dili pa mag-ani. Pagsul-ob og gwantes, mask ug taas nga bukton. Tan-awa ang kolor sa ubos sa label - ang berde ang labing gamay og hilo, sunod ang asul, unya ang dalag; gidili na ang mga pestisidyo nga pula ang label.', NULL, NULL, NULL, 1, 0, '2026-09-05 02:46:32', '2026-10-07 11:13:39'),
(4, 2, 'chemical', NULL, 'Fungicide Application', 'Paggamit og Fungicide', 'Use a fungicide only as a LAST resort: when about 50-60% of plants are damaged (the IPM action threshold) and field sanitation, leaf trimming and biological control have not held the disease. Choose a fungicide registered with the FPA for corn - for example one containing propiconazole, azoxystrobin or pyraclostrobin - and ask the City Agriculture Office before buying.', 'Gamita lang ang fungicide isip KATAPUSAN nga paagi: kung mga 50-60% na sa mga tanom ang nadaot (ang IPM action threshold) ug wala na makapugong ang paglimpyo sa uma, pagtangtang sa dahon ug biological control. Pagpili og fungicide nga rehistrado sa FPA alang sa mais - pananglitan nga adunay propiconazole, azoxystrobin o pyraclostrobin - ug pangutana una sa City Agriculture Office sa dili pa mopalit.', 'Follow the product label exactly: rate, re-spray interval and the days to wait before harvest. Wear gloves, a mask and long sleeves. Check the colour band at the bottom of the label - green is least toxic, then blue, then yellow; red-label pesticides are banned.', 'Sunda gyud ang label sa produkto: ang sukod, ang gintang sa pag-spray, ug ang mga adlaw nga hulaton sa dili pa mag-ani. Pagsul-ob og gwantes, mask ug taas nga bukton. Tan-awa ang kolor sa ubos sa label - ang berde ang labing gamay og hilo, sunod ang asul, unya ang dalag; gidili na ang mga pestisidyo nga pula ang label.', NULL, NULL, NULL, 1, 0, '2026-09-05 02:46:32', '2026-10-07 11:13:39'),
(5, 2, 'cultural', NULL, 'Residue Management', 'Pagdumala sa Nahabiling Tanom', 'Plow under or remove infected crop debris after harvest to reduce the spore source for the next planting.', 'Idaro o kuhaa ang nataptan nga mga salin sa tanom human sa ani aron makunhoran ang tinubdan sa spore para sa sunod nga tanom.', NULL, NULL, NULL, NULL, NULL, 1, 0, '2026-09-05 02:46:32', '2026-10-07 11:13:39'),
(6, 2, 'cultural', NULL, 'Crop Rotation', 'Pag-ilis-ilis sa Tanom', 'Rotate with a non-host crop, such as legumes or root crops, for at least one season - the fungus survives in leftover corn residue.', 'Pag-ilis og tanom nga dili host, sama sa munggos o gamot nga tanom, sulod sa labing menos usa ka tuig - mabuhi ang fungus sa nahabiling tuod sa mais.', NULL, NULL, 'Avoid planting corn after corn in the same field for consecutive seasons.', 'Likayi ang pagtanom og mais human sa mais sa samang uma sa sunod-sunod nga panahon.', NULL, 1, 0, '2026-09-05 02:46:32', '2026-10-07 11:13:39'),
(7, 4, NULL, NULL, 'Seek Local Guidance', 'Pangayo og Tabang sa Lokal', 'Consult your local agricultural extension worker or the City Agriculture Office if the infection is severe or spreading quickly.', 'Konsultaha ang inyong lokal nga agricultural extension worker o ang City Agriculture Office kung grabe o paspas nga mokaylap ang impeksyon.', NULL, NULL, NULL, NULL, NULL, 1, 0, '2026-09-05 02:46:32', '2026-09-07 14:06:23'),
(8, 4, 'cultural', NULL, 'Crop Rotation', 'Pag-ilis-ilis sa Tanom', 'Rotate with a non-host crop next season and favour resistant varieties where blight recurs.', 'Pag-ilis og tanom nga dili host sa sunod nga panahon ug pilia ang mga barayti nga lig-on kung balik-balik ang pagkalaya.', NULL, NULL, NULL, NULL, NULL, 1, 0, '2026-09-05 02:46:32', '2026-10-07 11:13:39'),
(9, 4, 'chemical', NULL, 'Fungicide Application', 'Paggamit og Fungicide', 'Use a fungicide only as a LAST resort: when about 50-60% of plants are damaged (the IPM action threshold) and field sanitation, leaf trimming and biological control have not held the disease. Choose a fungicide registered with the FPA for corn - for example one containing propiconazole, azoxystrobin or pyraclostrobin - and ask the City Agriculture Office before buying.', 'Gamita lang ang fungicide isip KATAPUSAN nga paagi: kung mga 50-60% na sa mga tanom ang nadaot (ang IPM action threshold) ug wala na makapugong ang paglimpyo sa uma, pagtangtang sa dahon ug biological control. Pagpili og fungicide nga rehistrado sa FPA alang sa mais - pananglitan nga adunay propiconazole, azoxystrobin o pyraclostrobin - ug pangutana una sa City Agriculture Office sa dili pa mopalit.', 'Follow the product label exactly: rate, re-spray interval and the days to wait before harvest. Wear gloves, a mask and long sleeves. Check the colour band at the bottom of the label - green is least toxic, then blue, then yellow; red-label pesticides are banned.', 'Sunda gyud ang label sa produkto: ang sukod, ang gintang sa pag-spray, ug ang mga adlaw nga hulaton sa dili pa mag-ani. Pagsul-ob og gwantes, mask ug taas nga bukton. Tan-awa ang kolor sa ubos sa label - ang berde ang labing gamay og hilo, sunod ang asul, unya ang dalag; gidili na ang mga pestisidyo nga pula ang label.', NULL, NULL, NULL, 1, 0, '2026-09-05 02:46:32', '2026-10-07 11:13:39'),
(10, 4, 'mechanical', NULL, 'Remove Infected Leaves', 'Kuhaa ang Nataptan nga mga Dahon', 'Remove and destroy severely infected leaves where practical to slow the spread of spores to healthy tissue.', 'Kuhaa ug gub-a ang grabe nga nataptan nga mga dahon kung mahimo aron mahinay ang pagkaylap sa spore ngadto sa himsog nga tisyu.', NULL, NULL, NULL, NULL, NULL, 1, 0, '2026-09-05 02:46:32', '2026-10-07 11:13:39'),
(12, 1, 'biological', NULL, 'Biological Control (Trichoderma)', 'Biological Control (Trichoderma)', 'While only a few plants are affected (about 10-20%), use a Trichoderma-based biological fungicide registered with the FPA instead of a chemical one.', 'Samtang gamay pa ang nataptan (mga 10-20% sa tanom), gamita ang biological fungicide nga Trichoderma nga rehistrado sa FPA imbes nga kemikal.', 'Mix and apply exactly as the product label says, in the early morning or late afternoon.', 'Sagola ug gamita sumala sa label sa produkto, sayo sa buntag o hapon na.', NULL, NULL, NULL, 1, 0, '2026-10-07 11:13:39', '2026-10-07 11:13:39'),
(13, 1, 'mechanical', NULL, 'Trim Infected Leaves', 'Tangtanga ang Nataptan nga Dahon', 'Cut off leaves with rust pustules, starting with the lowest ones, and carry them out of the field. Do this early, while only a few plants are affected.', 'Putla ang mga dahon nga adunay taya, sugdi sa pinakaubos, ug dad-a sa gawas sa uma. Buhata kini sayo, samtang pipila pa lang ka tanom ang nataptan.', 'Bury or burn the trimmed leaves away from the field - never leave them between the rows.', 'Ilubong o sunoga ang mga gitangtang nga dahon layo sa uma - ayaw ibilin taliwala sa mga linya.', NULL, NULL, NULL, 1, 0, '2026-10-07 11:13:39', '2026-10-07 11:13:39'),
(14, 1, 'cultural', NULL, 'Field Sanitation', 'Paglimpyo sa Uma', 'Keep the field clean: pull weeds, and after harvest remove or plow under old corn leaves and stalks so spores have nowhere to survive until the next planting.', 'Hinloi ang uma: ibton ang mga sagbot, ug human sa ani kuhaa o idaro ang daang dahon ug punoan sa mais aron walay kapuy-an ang mga spore hangtod sa sunod nga pagtanom.', NULL, NULL, NULL, NULL, NULL, 1, 0, '2026-10-07 11:13:39', '2026-10-07 11:13:39'),
(15, 2, 'resistant_variety', NULL, 'Resistant Varieties', 'Mga Barayti nga Lig-on Batok sa Sakit', 'Plant a corn variety rated resistant to gray leaf spot in your next planting. Ask the City Agriculture Office which resistant varieties are available in Pagadian.', 'Sa sunod nga pagtanom, gamita ang barayti sa mais nga lig-on batok sa gray leaf spot. Pangutana sa City Agriculture Office kung unsang mga lig-on nga barayti ang anaa sa Pagadian.', NULL, NULL, NULL, NULL, NULL, 1, 0, '2026-10-07 11:13:39', '2026-10-07 11:13:39'),
(16, 2, 'biological', NULL, 'Biological Control (Trichoderma)', 'Biological Control (Trichoderma)', 'While only a few plants are affected (about 10-20%), use a Trichoderma-based biological fungicide registered with the FPA instead of a chemical one.', 'Samtang gamay pa ang nataptan (mga 10-20% sa tanom), gamita ang biological fungicide nga Trichoderma nga rehistrado sa FPA imbes nga kemikal.', 'Mix and apply exactly as the product label says, in the early morning or late afternoon.', 'Sagola ug gamita sumala sa label sa produkto, sayo sa buntag o hapon na.', NULL, NULL, NULL, 1, 0, '2026-10-07 11:13:39', '2026-10-07 11:13:39'),
(17, 2, 'mechanical', NULL, 'Trim Infected Leaves', 'Tangtanga ang Nataptan nga Dahon', 'Cut off leaves with gray leaf spot lesions, starting with the lowest ones, and carry them out of the field before the lesions spread upward.', 'Putla ang mga dahon nga adunay gray leaf spot, sugdi sa pinakaubos, ug dad-a sa gawas sa uma sa dili pa mokaylap pataas ang mga samad.', 'Bury or burn the trimmed leaves away from the field - never leave them between the rows.', 'Ilubong o sunoga ang mga gitangtang nga dahon layo sa uma - ayaw ibilin taliwala sa mga linya.', NULL, NULL, NULL, 1, 0, '2026-10-07 11:13:39', '2026-10-07 11:13:39'),
(18, 4, 'resistant_variety', NULL, 'Resistant Varieties', 'Mga Barayti nga Lig-on Batok sa Sakit', 'Plant a corn variety rated resistant to northern leaf blight in your next planting. Ask the City Agriculture Office which resistant varieties are available in Pagadian.', 'Sa sunod nga pagtanom, gamita ang barayti sa mais nga lig-on batok sa northern leaf blight. Pangutana sa City Agriculture Office kung unsang mga lig-on nga barayti ang anaa sa Pagadian.', NULL, NULL, NULL, NULL, NULL, 1, 0, '2026-10-07 11:13:39', '2026-10-07 11:13:39'),
(19, 4, 'biological', NULL, 'Biological Control (Trichoderma)', 'Biological Control (Trichoderma)', 'While only a few plants are affected (about 10-20%), use a Trichoderma-based biological fungicide registered with the FPA instead of a chemical one.', 'Samtang gamay pa ang nataptan (mga 10-20% sa tanom), gamita ang biological fungicide nga Trichoderma nga rehistrado sa FPA imbes nga kemikal.', 'Mix and apply exactly as the product label says, in the early morning or late afternoon.', 'Sagola ug gamita sumala sa label sa produkto, sayo sa buntag o hapon na.', NULL, NULL, NULL, 1, 0, '2026-10-07 11:13:39', '2026-10-07 11:13:39'),
(20, 4, 'cultural', NULL, 'Field Sanitation', 'Paglimpyo sa Uma', 'Keep the field clean: pull weeds, and after harvest remove or plow under old corn leaves and stalks - the blight fungus survives in this leftover residue.', 'Hinloi ang uma: ibton ang mga sagbot, ug human sa ani kuhaa o idaro ang daang dahon ug punoan sa mais - ang fungus sa blight mabuhi sa mga nahabilin nga biya.', NULL, NULL, NULL, NULL, NULL, 1, 0, '2026-10-07 11:13:39', '2026-10-07 11:13:39');

-- --------------------------------------------------------

--
-- Table structure for table `detections`
--

CREATE TABLE `detections` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `disease_id` int(10) UNSIGNED DEFAULT NULL,
  `image_path` varchar(255) NOT NULL,
  `predicted_class` varchar(50) NOT NULL,
  `confidence_score` decimal(5,2) NOT NULL,
  `confidence_level` enum('low','moderate','high') NOT NULL,
  `risk_level` enum('none','low','moderate','high') NOT NULL,
  `all_probabilities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`all_probabilities`)),
  `model_version` varchar(50) DEFAULT NULL,
  `review_status` enum('unreviewed','confirmed','corrected') NOT NULL DEFAULT 'unreviewed',
  `corrected_class` varchar(50) DEFAULT NULL,
  `review_note` text DEFAULT NULL,
  `reviewed_by` int(10) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `detected_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `detections`
--

INSERT INTO `detections` (`id`, `user_id`, `disease_id`, `image_path`, `predicted_class`, `confidence_score`, `confidence_level`, `risk_level`, `all_probabilities`, `model_version`, `review_status`, `corrected_class`, `review_note`, `reviewed_by`, `reviewed_at`, `detected_at`) VALUES
(118, 28, 4, 'uploads/1788342489943-8059f803-897a-4246-8d29-13b50ff0015b.jpg', 'northern_leaf_blight', 99.11, 'high', 'high', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 06:20:26'),
(128, 28, 1, 'uploads/1793521564479-20dc30fb-4ec6-46a5-8aec-2da718e3461e.jpg', 'southern_rust', 96.64, 'high', 'moderate', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 08:26:07'),
(132, 28, 1, 'uploads/1793527615945-6202c944-2045-48b4-9c72-2cf61669fd06.jpg', 'southern_rust', 99.95, 'high', 'moderate', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:06:58'),
(133, 28, 1, 'uploads/1793527666311-ab432129-43ac-40de-a726-994920fa5527.jpg', 'southern_rust', 99.95, 'high', 'moderate', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:07:47'),
(134, 28, 2, 'uploads/1793527701413-03097bd9-1a76-4d39-88f4-9071e3648f9d.jpg', 'gray_leaf_spot', 99.99, 'high', 'high', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:08:22'),
(135, 28, 3, 'uploads/1793527730573-8761623a-682f-4836-bf3d-8515d548bb01.jpg', 'healthy', 98.86, 'high', 'none', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:08:51'),
(136, 28, 3, 'uploads/1793528073953-cb464a13-d9e9-4f4e-baa1-bc3460932998.jpg', 'healthy', 53.46, 'moderate', 'none', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:14:34'),
(137, 28, 3, 'uploads/1793529454128-57cea9e8-0bf9-4a4c-805f-2634a3a111f2.jpg', 'healthy', 79.72, 'high', 'none', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:37:38'),
(138, 28, 3, 'uploads/1793529860578-a9f93e54-6250-4afb-8637-d99eba43cf6c.jpg', 'healthy', 87.63, 'high', 'none', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:44:24'),
(139, 28, 3, 'uploads/1793530043442-615ac9bd-c2a5-4ab4-8ba3-19c3c37ebc88.jpg', 'healthy', 86.75, 'high', 'none', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:47:24'),
(140, 28, 2, 'uploads/1793530109205-d350fe54-a244-40c9-8ecf-eb644428ae94.jpg', 'gray_leaf_spot', 96.73, 'high', 'high', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:48:32'),
(141, 28, 3, 'uploads/1793530131536-4a8fab4b-d4b5-4c7e-9a6c-983fb24fc68b.jpg', 'healthy', 83.88, 'high', 'none', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:49:01'),
(142, 28, 1, 'uploads/1793530380853-9fadbde5-e444-4d2c-ae3c-716e64b3fc94.jpg', 'southern_rust', 99.95, 'high', 'moderate', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-01 10:53:03'),
(143, 28, 4, 'uploads/1793972186182-3265b249-5d32-47b2-8a8d-d974bf064869.jpg', 'northern_leaf_blight', 90.41, 'high', 'high', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-06 13:46:04'),
(144, 28, 4, 'uploads/1793981766719-1357dc11-b76d-42be-883e-785d7f09c695.jpg', 'northern_leaf_blight', 90.41, 'high', 'high', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-06 16:16:09'),
(145, 28, 2, 'uploads/1793982698684-13a7dc46-8e2c-49ca-bfc1-f9457a82a7bc.jpg', 'gray_leaf_spot', 97.36, 'high', 'high', NULL, 'mobilenetv2-v2', 'unreviewed', NULL, NULL, NULL, NULL, '2026-11-06 16:31:41');

-- --------------------------------------------------------

--
-- Table structure for table `diseases`
--

CREATE TABLE `diseases` (
  `id` int(10) UNSIGNED NOT NULL,
  `class_label` varchar(50) NOT NULL,
  `display_name` varchar(100) NOT NULL,
  `display_name_ceb` varchar(100) DEFAULT NULL,
  `scientific_name` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `description_ceb` text DEFAULT NULL,
  `symptoms` text DEFAULT NULL,
  `symptoms_ceb` text DEFAULT NULL,
  `default_risk_level` enum('none','low','moderate','high') NOT NULL DEFAULT 'moderate',
  `is_healthy` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `diseases`
--

INSERT INTO `diseases` (`id`, `class_label`, `display_name`, `display_name_ceb`, `scientific_name`, `description`, `description_ceb`, `symptoms`, `symptoms_ceb`, `default_risk_level`, `is_healthy`, `created_at`, `updated_at`) VALUES
(1, 'southern_rust', 'Southern Rust', 'Habagatang Taya', 'Puccinia polysora', 'Southern rust, also called corn rust, is a fungal disease of corn caused by Puccinia polysora. The fungus needs living corn tissue to survive, so it does not survive in dead crop debris. Its spores are spread by wind and rain from rust pustules. It can attack corn at the seedling, vegetative, flowering, and fruiting stages. In the Philippines, an outbreak in 1953 reduced yields by 80-84%.\n\nFavorable conditions:\nWarm temperatures of about 20–30 °C. This disease is more common in tropical lowlands like Pagadian than in cool highlands.\nHigh humidity and frequent rain. In the Philippines, the rainy season is the main risk period.\nWind. Spores can travel far between fields, so a clean field can still get infected from a neighbor’s field.\nLate planting. Young leaves are more susceptible, so fields planted late in the season are more at risk.\n\nImpact: Rust reduces the leaf area that makes food (photosynthesis). This leads to poorly filled kernels, weak stalks that can fall over (lodging), and lower yield.', 'Ang habagatang taya, gitawag usab og taya sa mais, usa ka sakit sa mais nga gikan sa fungus nga Puccinia polysora. Kinahanglan sa fungus ang buhi nga tisyu sa mais aron mabuhi, busa dili kini mabuhi sa patay nga salin sa tanom. Ang mga spore niini gidala sa hangin ug ulan gikan sa mga bukol sa taya. Makatakod kini sa mais sukad sa semilya, sa pagtubo, sa pagpamulak, hangtod sa pagpamunga. Sa Pilipinas, usa ka outbreak niadtong 1953 ang nakapakunhod sa ani og 80-84%.\n\nKahimtang nga paborable sa sakit:\nInit nga temperatura nga mga 20–30 °C. Mas kasagaran kini nga sakit sa tropikal nga ubos nga mga lugar sama sa Pagadian kaysa sa bugnaw nga kabukiran.\nTaas nga umog ug kanunay nga ulan. Sa Pilipinas, ang tag-ulan mao ang panahon nga pinakadelikado.\nHangin. Makabiyahe og layo ang mga spore tali sa mga uma, busa ang limpyo nga uma mahimo gihapong mataptan gikan sa uma sa silingan.\nUlahing pagtanom. Mas dali mataptan ang bata nga mga dahon, busa mas delikado ang mga uma nga gitanom sa ulahing bahin sa panahon.\n\nEpekto: Gipakunhod sa taya ang bahin sa dahon nga mohimo og pagkaon (photosynthesis). Tungod niini, dili mapuno pag-ayo ang mga lugas, maluya ang lawas sa tanom ug mahimong matumba (lodging), ug mokunhod ang ani.', 'Round, light green to yellow spots that develop into small round to oval pustules with orange to cinnamon-brown spores, densely scattered mostly on the upper leaf surface.\nPustules can also appear on husks, leaf sheaths, ear shanks, and stalks.\nInfected leaves dry up early.', 'Lingin, light green ngadto sa dalag nga mga tulpok nga mahimong gagmay, lingin ngadto sa oval nga mga bukol nga adunay orange ngadto sa cinnamon-brown nga spore, dasok nga nagkatag kasagaran sa ibabaw nga bahin sa dahon.\nMahimo usab motungha ang mga bukol sa panit sa puso, sa sapaw sa dahon, sa tangkay sa puso, ug sa lawas sa tanom.\nSayo nga mamala ang nataptan nga mga dahon.', 'moderate', 0, '2026-08-31 15:24:20', '2026-10-21 11:20:20'),
(2, 'gray_leaf_spot', 'Gray Leaf Spot', 'Abuhon nga Tulpok sa Dahon', 'Cercospora zeae-maydis', 'Gray leaf spot is a fungal disease of corn caused by Cercospora zeae-maydis. The Department of Agriculture lists it as one of the common corn diseases in the Philippines. The fungus survives on infected corn leaves left in the field. It can affect corn at the vegetative, flowering, and fruiting stages.\n\nFavorable conditions:\nWarm temperatures of 22–30 °C. These are common in Philippine lowlands most of the year.\nVery high humidity (above 90%) and long periods of wet leaves from rain, dew, or irrigation. Risk is highest in the rainy season.\nInfected corn leaves left on the soil, especially when farmers plant corn after corn without rotation.\nCrowded planting that keeps leaves wet longer.', 'Ang gray leaf spot usa ka sakit sa mais nga gikan sa fungus nga Cercospora zeae-maydis. Gilista kini sa Department of Agriculture isip usa sa kasagarang sakit sa mais sa Pilipinas. Mabuhi ang fungus sa nataptan nga mga dahon sa mais nga nahabilin sa uma. Makatakod kini sa mais sa pagtubo, pagpamulak, ug pagpamunga.\n\nKahimtang nga paborable sa sakit:\nInit nga temperatura nga 22–30 °C. Kasagaran kini sa ubos nga mga lugar sa Pilipinas sa kadaghanang bahin sa tuig.\nTaas kaayo nga umog (labaw sa 90%) ug dugay nga pagkabasa sa dahon tungod sa ulan, yamog, o patubig. Pinakadelikado sa tag-ulan.\nNataptan nga mga dahon sa mais nga nahabilin sa yuta, labi na kung motanom ang mga mag-uuma og mais human sa mais nga walay rotation.\nDasok nga pagtanom nga maghimo nga mas dugay mabasa ang mga dahon.', 'Small pin-point spots surrounded by a yellow halo.\nThe spots grow into long, narrow, rectangular lesions bounded by the leaf veins, running parallel to them, on both sides of the leaf.\nLesions can merge and kill large parts of the leaf.\nSevere infection causes early drying, weak or broken stalks, and poorly filled ears.', 'Gagmay kaayo nga mga tulpok nga gilibutan og dalag nga halo.\nMotubo ang mga tulpok ngadto sa taas, pig-ot, rektanggulo nga mga samad nga gilimitahan sa ugat sa dahon ug parallel niini, sa duha ka kilid sa dahon.\nMahimong maghiusa ang mga samad ug mopatay sa dagkong bahin sa dahon.\nAng grabe nga impeksyon mosangpot sa sayo nga pagkamala, maluya o mabali nga lawas sa tanom, ug dili mapuno nga mga puso.', 'high', 0, '2026-08-31 15:24:20', '2026-10-21 11:20:20'),
(3, 'healthy', 'Healthy Corn Leaf', 'Himsog nga Dahon sa Mais', NULL, 'No disease symptoms detected. The leaf appears healthy.', 'Walay nakita nga simtomas sa sakit. Morag himsog ang dahon.', 'Uniform green coloration with no lesions, spots, pustules, or necrotic tissue.', 'Parehas nga lunhaw nga kolor nga walay samad, tulpok, bukol, o patay nga tisyu.', 'none', 1, '2026-08-31 15:24:20', '2026-09-07 14:06:23'),
(4, 'northern_leaf_blight', 'Northern Leaf Blight', 'Amihanang Pagkalaya sa Dahon', 'Exserohilum turcicum', 'Northern leaf blight is a fungal disease of corn caused by Exserohilum turcicum, also known as Setosphaeria turcica or Helminthosporium turcicum. It is one of the common corn diseases in the Philippines listed by the Department of Agriculture. It causes long, cigar-shaped spots on the leaves and can make the leaves dry up early, even while the corn is still young.\n\nFavorable conditions:\nLong periods of wet, cloudy, humid weather. In the Philippines, this is the rainy season.\nModerate temperatures of about 18–30 °C. Cooler, higher-elevation farms and cool rainy days carry more risk.\nPlanting corn after corn without rotation, and minimum tillage that leaves old corn debris on the surface.\nInfected leftover corn plants in the field. The fungus survives there, and rain splash and wind spread its spores.', 'Ang northern leaf blight usa ka sakit sa mais nga gikan sa fungus nga Exserohilum turcicum, nailhan usab nga Setosphaeria turcica o Helminthosporium turcicum. Usa kini sa kasagarang sakit sa mais sa Pilipinas nga gilista sa Department of Agriculture. Mohimo kini og tag-as, porma og tabako nga mga tulpok sa dahon ug makapamala sa mga dahon og sayo, bisan bata pa ang mais.\n\nKahimtang nga paborable sa sakit:\nDugay nga basa, madag-om, ug umog nga panahon. Sa Pilipinas, kini mao ang tag-ulan.\nKasarangang temperatura nga mga 18–30 °C. Mas delikado ang bugnaw nga mga uma sa taas nga lugar ug ang bugnaw nga mga adlaw nga ulan.\nPagtanom og mais human sa mais nga walay rotation, ug minimum tillage nga mobiya sa daan nga salin sa mais sa ibabaw sa yuta.\nNataptan nga salin sa tanom nga mais sa uma. Didto mabuhi ang fungus, ug ang mga spore niini gikatag sa tumpak sa ulan ug sa hangin.', 'Long, oval (elliptical), grayish-green spots on the leaf, about 20 mm long and 5 mm wide, shaped like a cigarette.\nLeaves dry up early, even when the corn is still young.\nSmall black dots appear on the dried parts of the leaf.\nSpots appear first on the lower leaves.', 'Taas, oval (elliptical), abuhon-lunhaw nga mga tulpok sa dahon, mga 20 mm ang gitas-on ug 5 mm ang gilapdon, porma og sigarilyo.\nSayo nga mamala ang mga dahon, bisan bata pa ang mais.\nMotungha ang gagmay nga itom nga tuldok sa namala nga bahin sa dahon.\nUna nga motungha ang mga tulpok sa ubos nga mga dahon.', 'high', 0, '2026-08-31 15:24:20', '2026-10-21 11:20:20');

-- --------------------------------------------------------

--
-- Table structure for table `farmers`
--

CREATE TABLE `farmers` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `region` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `municipality` varchar(100) DEFAULT 'Pagadian City',
  `corn_type` enum('white','yellow','both') DEFAULT NULL,
  `farm_size_hectares` decimal(6,2) DEFAULT NULL,
  `years_farming` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `farmers`
--

INSERT INTO `farmers` (`id`, `user_id`, `region`, `province`, `address`, `barangay`, `municipality`, `corn_type`, `farm_size_hectares`, `years_farming`, `created_at`, `updated_at`) VALUES
(21, 28, 'REGION IX (ZAMBOANGA PENINSULA)', 'Zamboanga del Sur', 'Banale', 'Banale', 'Pagadian City', NULL, 6.50, NULL, '2026-09-16 18:30:04', '2026-10-20 14:50:10'),
(22, 29, 'REGION IX (ZAMBOANGA PENINSULA)', NULL, NULL, NULL, NULL, NULL, 2.50, NULL, '2026-09-18 10:49:01', '2026-09-19 15:47:00'),
(23, 30, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-18 10:52:52', '2026-09-18 10:52:52'),
(29, 39, 'REGION IX (ZAMBOANGA PENINSULA)', 'Zamboanga del Sur', 'Bulatok', 'Bulatok', 'Pagadian City (Capital)', NULL, 1.00, NULL, '2026-11-06 17:04:16', '2026-11-06 17:04:16');

-- --------------------------------------------------------

--
-- Table structure for table `farm_plots`
--

CREATE TABLE `farm_plots` (
  `id` int(10) UNSIGNED NOT NULL,
  `farmer_user_id` int(10) UNSIGNED NOT NULL,
  `purok` varchar(100) DEFAULT NULL,
  `area_value` decimal(10,2) NOT NULL,
  `area_unit` enum('hectare','sqm') NOT NULL DEFAULT 'hectare',
  `area_hectares` decimal(12,4) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `farm_plots`
--

INSERT INTO `farm_plots` (`id`, `farmer_user_id`, `purok`, `area_value`, `area_unit`, `area_hectares`, `note`, `created_at`, `updated_at`) VALUES
(13, 29, 'Deb', 2.50, 'hectare', 2.5000, NULL, '2026-09-19 15:43:39', '2026-09-19 15:43:39'),
(14, 28, 'Sayote', 1.50, 'hectare', 1.5000, NULL, '2026-10-20 14:50:10', '2026-10-20 14:50:10'),
(15, 28, 'bayabas', 5.00, 'hectare', 5.0000, NULL, '2026-10-20 14:50:10', '2026-10-20 14:50:10'),
(16, 39, 'A1', 1.00, 'hectare', 1.0000, NULL, '2026-11-06 17:04:16', '2026-11-06 17:04:16');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `type` varchar(40) NOT NULL,
  `title` varchar(180) NOT NULL,
  `body` varchar(500) DEFAULT NULL,
  `report_id` int(10) UNSIGNED DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `body`, `report_id`, `is_read`, `read_at`, `created_at`) VALUES
(155, 3, 'report_submitted', 'New report from Jhoana Marie Sanchez Sumalpong', 'an unspecified barangay - Southern Rust - 7 of 13 scans affected', 30, 1, '2026-11-06 13:36:59', '2026-11-06 13:35:38'),
(156, 28, 'report_status', 'Report Under Review', 'The City Agriculture Office is now reviewing your report.', 30, 1, '2026-11-06 13:48:55', '2026-11-06 13:37:03'),
(157, 28, 'report_status', 'Report Verified', 'The CAO has verified the disease findings in your report.', 30, 1, '2026-11-06 13:48:55', '2026-11-06 13:37:05'),
(158, 28, 'report_status', 'Report Agriculturist Visit Required', 'Your report requires an agriculturist field assessment. A visit is being arranged.', 30, 1, '2026-11-06 13:48:55', '2026-11-06 13:37:06'),
(159, 28, 'report_status', 'Report Agriculturist Assigned', 'An agriculturist has been assigned to visit and assess your area. Agriculturist: Grace Villaruz.', 30, 1, '2026-11-06 13:48:55', '2026-11-06 13:37:10'),
(160, 28, 'report_status', 'Report Field Assessment Completed', 'The field assessment for your report has been completed.', 30, 1, '2026-11-06 13:48:55', '2026-11-06 13:37:12'),
(161, 28, 'report_status', 'Report Resolved', 'Your report has been resolved. Thank you for reporting.', 30, 1, '2026-11-06 13:48:55', '2026-11-06 13:37:12'),
(162, 3, 'report_submitted', 'New report from Jhoana Marie Sanchez Sumalpong', 'Banale - Southern Rust - 8 of 14 scans affected', 31, 0, NULL, '2026-11-06 16:15:37'),
(163, 3, 'report_submitted', 'New report from Jhoana Marie Sanchez Sumalpong', 'Banale - Northern Leaf Blight - 1 of 1 scans affected', 32, 1, '2026-11-06 16:35:59', '2026-11-06 16:16:23'),
(164, 3, 'report_submitted', 'New report from Jhoana Marie Sanchez Sumalpong', 'Banale - Gray Leaf Spot - 1 of 1 scans affected', 33, 0, NULL, '2026-11-06 16:32:04');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_codes`
--

CREATE TABLE `password_reset_codes` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `code_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `consumed_at` datetime DEFAULT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_codes`
--

INSERT INTO `password_reset_codes` (`id`, `user_id`, `code_hash`, `expires_at`, `consumed_at`, `attempts`, `created_at`) VALUES
(6, 28, '690b4d8e58eb2c2bb13ab8a46287cfa3560a7bf32c7f496602c5d637559be3d2', '2026-09-17 12:22:23', NULL, 0, '2026-09-17 12:07:23'),
(12, 3, '92ad7d7374abc450f4f8cb5df663b4ad59764e3e68d3ab2a395920ab8f8a23d8', '2026-11-06 16:58:27', NULL, 0, '2026-11-06 16:43:27');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(10) UNSIGNED NOT NULL,
  `farmer_id` int(10) UNSIGNED NOT NULL,
  `barangay` varchar(150) DEFAULT NULL,
  `municipality` varchar(100) DEFAULT NULL,
  `total_scans` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `affected_scans` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `healthy_scans` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `disease_breakdown` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`disease_breakdown`)),
  `estimated_area_hectares` decimal(6,2) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `status` enum('pending','under_review','verified','agriculturist_required','agriculturist_assigned','field_assessment_completed','resolved') NOT NULL DEFAULT 'pending',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `read_by` int(10) UNSIGNED DEFAULT NULL,
  `cao_message` text DEFAULT NULL,
  `assigned_agriculturist` varchar(150) DEFAULT NULL,
  `assigned_agriculturist_id` int(10) UNSIGNED DEFAULT NULL,
  `reviewed_by` int(10) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `farmer_id`, `barangay`, `municipality`, `total_scans`, `affected_scans`, `healthy_scans`, `disease_breakdown`, `estimated_area_hectares`, `remarks`, `status`, `is_read`, `read_at`, `read_by`, `cao_message`, `assigned_agriculturist`, `assigned_agriculturist_id`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES
(30, 28, NULL, NULL, 13, 7, 6, '[{\"classLabel\":\"southern_rust\",\"displayName\":\"Southern Rust\",\"count\":4},{\"classLabel\":\"gray_leaf_spot\",\"displayName\":\"Gray Leaf Spot\",\"count\":2},{\"classLabel\":\"northern_leaf_blight\",\"displayName\":\"Northern Leaf Blight\",\"count\":1}]', 1.00, NULL, 'resolved', 1, '2026-11-06 13:36:59', 3, NULL, 'Grace Villaruz', 4, 3, '2026-11-06 13:37:12', '2026-11-06 13:35:38'),
(31, 28, 'Banale', 'Pagadian City', 14, 8, 6, '[{\"classLabel\":\"northern_leaf_blight\",\"displayName\":\"Northern Leaf Blight\",\"count\":2},{\"classLabel\":\"southern_rust\",\"displayName\":\"Southern Rust\",\"count\":4},{\"classLabel\":\"gray_leaf_spot\",\"displayName\":\"Gray Leaf Spot\",\"count\":2}]', NULL, NULL, 'pending', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-06 16:15:37'),
(32, 28, 'Banale', 'Pagadian City', 1, 1, 0, '[{\"classLabel\":\"northern_leaf_blight\",\"displayName\":\"Northern Leaf Blight\",\"count\":1}]', NULL, NULL, 'pending', 1, '2026-11-06 16:35:59', 3, NULL, NULL, NULL, NULL, NULL, '2026-11-06 16:16:23'),
(33, 28, 'Banale', 'Pagadian City', 1, 1, 0, '[{\"classLabel\":\"gray_leaf_spot\",\"displayName\":\"Gray Leaf Spot\",\"count\":1}]', NULL, NULL, 'pending', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-11-06 16:32:04');

-- --------------------------------------------------------

--
-- Table structure for table `report_images`
--

CREATE TABLE `report_images` (
  `id` int(10) UNSIGNED NOT NULL,
  `report_id` int(10) UNSIGNED NOT NULL,
  `detection_id` int(10) UNSIGNED DEFAULT NULL,
  `class_label` varchar(50) DEFAULT NULL,
  `display_name` varchar(150) DEFAULT NULL,
  `image_path` varchar(255) NOT NULL,
  `confidence_score` decimal(5,2) DEFAULT NULL,
  `risk_level` enum('none','low','moderate','high') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_images`
--

INSERT INTO `report_images` (`id`, `report_id`, `detection_id`, `class_label`, `display_name`, `image_path`, `confidence_score`, `risk_level`, `created_at`) VALUES
(75, 30, NULL, 'southern_rust', 'Southern Rust', 'uploads/1793530380853-9fadbde5-e444-4d2c-ae3c-716e64b3fc94.jpg', 100.00, 'moderate', '2026-11-06 13:35:38'),
(76, 30, NULL, 'gray_leaf_spot', 'Gray Leaf Spot', 'uploads/1793530109205-d350fe54-a244-40c9-8ecf-eb644428ae94.jpg', 96.70, 'high', '2026-11-06 13:35:38'),
(77, 30, NULL, 'gray_leaf_spot', 'Gray Leaf Spot', 'uploads/1793527701413-03097bd9-1a76-4d39-88f4-9071e3648f9d.jpg', 100.00, 'high', '2026-11-06 13:35:38'),
(78, 30, NULL, 'southern_rust', 'Southern Rust', 'uploads/1793527666311-ab432129-43ac-40de-a726-994920fa5527.jpg', 100.00, 'moderate', '2026-11-06 13:35:38'),
(79, 30, NULL, 'southern_rust', 'Southern Rust', 'uploads/1793527615945-6202c944-2045-48b4-9c72-2cf61669fd06.jpg', 100.00, 'moderate', '2026-11-06 13:35:38'),
(80, 30, NULL, 'southern_rust', 'Southern Rust', 'uploads/1793521564479-20dc30fb-4ec6-46a5-8aec-2da718e3461e.jpg', 96.60, 'moderate', '2026-11-06 13:35:38'),
(81, 30, NULL, 'northern_leaf_blight', 'Northern Leaf Blight', 'uploads/1788342489943-8059f803-897a-4246-8d29-13b50ff0015b.jpg', 99.10, 'high', '2026-11-06 13:35:38'),
(82, 31, NULL, 'northern_leaf_blight', 'Northern Leaf Blight', 'uploads/1793972186182-3265b249-5d32-47b2-8a8d-d974bf064869.jpg', 90.40, 'high', '2026-11-06 16:15:37'),
(83, 31, NULL, 'southern_rust', 'Southern Rust', 'uploads/1793530380853-9fadbde5-e444-4d2c-ae3c-716e64b3fc94.jpg', 100.00, 'moderate', '2026-11-06 16:15:37'),
(84, 31, NULL, 'gray_leaf_spot', 'Gray Leaf Spot', 'uploads/1793530109205-d350fe54-a244-40c9-8ecf-eb644428ae94.jpg', 96.70, 'high', '2026-11-06 16:15:37'),
(85, 31, NULL, 'gray_leaf_spot', 'Gray Leaf Spot', 'uploads/1793527701413-03097bd9-1a76-4d39-88f4-9071e3648f9d.jpg', 100.00, 'high', '2026-11-06 16:15:37'),
(86, 31, NULL, 'southern_rust', 'Southern Rust', 'uploads/1793527666311-ab432129-43ac-40de-a726-994920fa5527.jpg', 100.00, 'moderate', '2026-11-06 16:15:37'),
(87, 31, NULL, 'southern_rust', 'Southern Rust', 'uploads/1793527615945-6202c944-2045-48b4-9c72-2cf61669fd06.jpg', 100.00, 'moderate', '2026-11-06 16:15:37'),
(88, 31, NULL, 'southern_rust', 'Southern Rust', 'uploads/1793521564479-20dc30fb-4ec6-46a5-8aec-2da718e3461e.jpg', 96.60, 'moderate', '2026-11-06 16:15:37'),
(89, 31, NULL, 'northern_leaf_blight', 'Northern Leaf Blight', 'uploads/1788342489943-8059f803-897a-4246-8d29-13b50ff0015b.jpg', 99.10, 'high', '2026-11-06 16:15:37'),
(90, 32, NULL, 'northern_leaf_blight', 'Northern Leaf Blight', 'uploads/1793981766719-1357dc11-b76d-42be-883e-785d7f09c695.jpg', 90.40, 'high', '2026-11-06 16:16:23'),
(91, 33, NULL, 'gray_leaf_spot', 'Gray Leaf Spot', 'uploads/1793982698684-13a7dc46-8e2c-49ca-bfc1-f9457a82a7bc.jpg', 97.40, 'high', '2026-11-06 16:32:04');

-- --------------------------------------------------------

--
-- Table structure for table `treatment_recommendations`
--

CREATE TABLE `treatment_recommendations` (
  `id` int(10) UNSIGNED NOT NULL,
  `disease_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(150) NOT NULL,
  `title_ceb` varchar(150) DEFAULT NULL,
  `recommendation_text` text NOT NULL,
  `recommendation_text_ceb` text DEFAULT NULL,
  `application_method` text DEFAULT NULL,
  `application_method_ceb` text DEFAULT NULL,
  `preventive_measures` text DEFAULT NULL,
  `preventive_measures_ceb` text DEFAULT NULL,
  `control_level` enum('prevention','cultural','monitoring','chemical') DEFAULT NULL,
  `created_by` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `treatment_recommendations`
--

INSERT INTO `treatment_recommendations` (`id`, `disease_id`, `title`, `title_ceb`, `recommendation_text`, `recommendation_text_ceb`, `application_method`, `application_method_ceb`, `preventive_measures`, `preventive_measures_ceb`, `control_level`, `created_by`, `is_active`, `created_at`, `updated_at`) VALUES
(151, 1, 'Resistant Varieties', 'Mga Barayti nga Lig-on Batok sa Sakit', 'Plant a rust-resistant corn variety. This is the main recommended control. Ask the City Agriculture Office which resistant varieties are available in Pagadian.', 'Pagtanom og barayti sa mais nga lig-on batok sa taya. Kini ang pangunang girekomendar nga pagpugong. Pangutan-a ang City Agriculture Office kung unsang mga barayti nga lig-on ang anaa sa Pagadian.', NULL, NULL, NULL, NULL, 'prevention', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(152, 1, 'Good Farm Practices', 'Maayong Pamaagi sa Pag-uma', 'Use good-quality seed, plant during the recommended season, use proper plant spacing, and keep the field clean. Follow the advice of your agricultural technologist.', 'Gamita ang maayong klase sa binhi, pagtanom sa girekomendar nga panahon, gamita ang sakto nga gilay-on sa tanom, ug limpyohi ang uma. Sunda ang tambag sa inyong agricultural technologist.', NULL, NULL, NULL, NULL, 'cultural', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(153, 1, 'Field Monitoring', 'Pagbantay sa Uma', 'Check your corn regularly for orange-brown pustules on the upper leaf surface, especially during warm, rainy weather. Early detection matters because fungicides work best before the disease spreads.', 'Susiha kanunay ang inyong mais kung adunay orange-brown nga mga bukol sa ibabaw nga bahin sa dahon, ilabina sa init ug ulanon nga panahon. Importante ang sayo nga pagkakita kay mas epektibo ang fungicide sa dili pa mokaylap ang sakit.', NULL, NULL, NULL, NULL, 'monitoring', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(154, 1, 'Fungicide Application', 'Paggamit og Fungicide', 'If rust appears, spray early, before it spreads through the whole plant and before the corn is near maturity. Fungicides containing propiconazole, pyraclostrobin, picoxystrobin, azoxystrobin, trifloxystrobin, or prothioconazole (alone or combined) can be used. Use only products registered by the FPA for rust on corn. Fungicides are poisonous: wear gloves and a mask, and follow the label.', 'Kung motungha ang taya, pag-ispray dayon, sa dili pa kini mokaylap sa tibuok tanom ug sa dili pa hapit mahinog ang mais. Mahimong gamiton ang fungicide nga adunay propiconazole, pyraclostrobin, picoxystrobin, azoxystrobin, trifloxystrobin, o prothioconazole (usa ra o gisagol). Gamita lang ang mga produkto nga rehistrado sa FPA alang sa taya sa mais. Peligroso ang fungicide: magsuot og guwantes ug mask, ug sunda ang label.', NULL, NULL, NULL, NULL, 'chemical', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(155, 1, 'Seek Local Guidance', 'Pangayo og Tabang sa Lokal', 'Consult your agricultural extension worker or the City Agriculture Office if the infection is severe or spreading quickly.', 'Konsultaha ang inyong agricultural extension worker o ang City Agriculture Office kung grabe o paspas nga mokaylap ang impeksyon.', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(156, 2, 'Resistant Varieties', 'Mga Barayti nga Lig-on Batok sa Sakit', 'Plant corn varieties resistant to gray leaf spot. This is the most effective control. Ask the City Agriculture Office which resistant varieties are available in Pagadian.', 'Pagtanom og mga barayti sa mais nga lig-on batok sa gray leaf spot. Kini ang labing epektibo nga pagpugong. Pangutan-a ang City Agriculture Office kung unsang mga barayti nga lig-on ang anaa sa Pagadian.', NULL, NULL, NULL, NULL, 'prevention', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(157, 2, 'Crop Rotation', 'Pag-ilis-ilis sa Tanom', 'Rotate with a non-host crop such as soybean or other legumes.', 'Pag-ilis og tanom nga dili host sama sa soybean o ubang mga legume.', NULL, NULL, NULL, NULL, 'cultural', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(158, 2, 'Residue Management', 'Pagdumala sa Nahabiling Tanom', 'After harvest, plow under or remove leftover corn leaves and stalks so the fungus has nowhere to survive, except in areas where the soil erodes easily.', 'Human sa ani, idaro o kuhaa ang nahabiling mga dahon ug lawas sa mais aron walay kabuhian ang fungus, gawas sa mga lugar nga dali ma-erosion ang yuta.', NULL, NULL, NULL, NULL, 'cultural', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(159, 2, 'Keep Plants Healthy', 'Atimana nga Himsog ang Tanom', 'Apply balanced fertilizer and control pests so the corn is less stressed. Avoid planting too densely, so air can move and leaves dry faster.', 'Gamita ang balanse nga abono ug pugngi ang mga peste aron dili ma-stress ang mais. Ayaw pagtanom og dasok kaayo aron makaagi ang hangin ug dali mamala ang mga dahon.', NULL, NULL, NULL, NULL, 'cultural', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(160, 2, 'Field Monitoring', 'Pagbantay sa Uma', 'Check the field regularly, especially during long rainy or humid periods.', 'Susiha kanunay ang uma, ilabina sa dugay nga ulanon o umog nga panahon.', NULL, NULL, NULL, NULL, 'monitoring', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(161, 2, 'Fungicide Application', 'Paggamit og Fungicide', 'If the disease is spreading, spray a fungicide recommended by your agricultural technologist. Use only FPA-registered products for corn, and ask the City Agriculture Office before buying. Fungicides are poisonous: wear gloves and a mask, and follow the label.', 'Kung nagkaylap ang sakit, pag-ispray og fungicide nga girekomendar sa inyong agricultural technologist. Gamita lang ang mga produkto nga rehistrado sa FPA alang sa mais, ug pangutana sa City Agriculture Office sa dili pa mopalit. Peligroso ang fungicide: magsuot og guwantes ug mask, ug sunda ang label.', NULL, NULL, NULL, NULL, 'chemical', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(162, 2, 'Seek Local Guidance', 'Pangayo og Tabang sa Lokal', 'Consult your agricultural extension worker or the City Agriculture Office if the infection is severe or spreading quickly.', 'Konsultaha ang inyong agricultural extension worker o ang City Agriculture Office kung grabe o paspas nga mokaylap ang impeksyon.', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(163, 4, 'Resistant Varieties', 'Mga Barayti nga Lig-on Batok sa Sakit', 'Plant corn varieties resistant to leaf blight. This is the best and cheapest way to control the disease. Ask the City Agriculture Office which resistant varieties are available in Pagadian.', 'Pagtanom og mga barayti sa mais nga lig-on batok sa leaf blight. Kini ang labing maayo ug labing barato nga paagi sa pagpugong sa sakit. Pangutan-a ang City Agriculture Office kung unsang mga barayti nga lig-on ang anaa sa Pagadian.', NULL, NULL, NULL, NULL, 'prevention', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(164, 4, 'Crop Rotation', 'Pag-ilis-ilis sa Tanom', 'Rotate with a non-host crop such as soybean to lower the chance of the disease coming back.', 'Pag-ilis og tanom nga dili host sama sa soybean aron makunhoran ang posibilidad nga mobalik ang sakit.', NULL, NULL, NULL, NULL, 'cultural', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(165, 4, 'Keep Plants Healthy', 'Atimana nga Himsog ang Tanom', 'Apply the right fertilizer and control pests so the corn is less stressed and stays strong.', 'Gamita ang sakto nga abono ug pugngi ang mga peste aron dili ma-stress ang mais ug magpabiling lig-on.', NULL, NULL, NULL, NULL, 'cultural', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(166, 4, 'Field Monitoring', 'Pagbantay sa Uma', 'Check the field regularly, starting with the lower leaves, and learn to recognize the symptoms early.', 'Susiha kanunay ang uma, sugod sa ubos nga mga dahon, ug kat-oni ang pag-ila sa mga simtomas og sayo.', NULL, NULL, NULL, NULL, 'monitoring', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(167, 4, 'Fungicide Application', 'Paggamit og Fungicide', 'Use a fungicide registered by the FPA for northern leaf blight on corn, for example Etiage SC 300. DA mainly recommends spraying in fields grown for seed production. Ask the CAO before buying. Fungicides are poisonous: wear gloves and a mask, and follow the label.', 'Gamita ang fungicide nga rehistrado sa FPA alang sa northern leaf blight sa mais, pananglitan ang Etiage SC 300. Kasagaran girekomendar sa DA ang pag-ispray sa mga uma nga gitamnan alang sa binhi. Pangutana sa CAO sa dili pa mopalit. Peligroso ang fungicide: magsuot og guwantes ug mask, ug sunda ang label.', NULL, NULL, NULL, NULL, 'chemical', NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20'),
(168, 4, 'Seek Local Guidance', 'Pangayo og Tabang sa Lokal', 'Consult your agricultural extension worker or the City Agriculture Office if the infection is severe or spreading quickly.', 'Konsultaha ang inyong agricultural extension worker o ang City Agriculture Office kung grabe o paspas nga mokaylap ang impeksyon.', NULL, NULL, NULL, NULL, NULL, NULL, 1, '2026-10-21 11:20:20', '2026-10-21 11:20:20');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone_number` varchar(20) NOT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `avatar_path` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('farmer','admin') NOT NULL DEFAULT 'farmer',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `username`, `email`, `phone_number`, `gender`, `date_of_birth`, `avatar_path`, `password_hash`, `role`, `is_active`, `created_at`, `updated_at`) VALUES
(3, 'CAO Administrator', 'admins', 'leafscan.cao@gmail.com', '09123456789', NULL, NULL, 'uploads/1789585518334-2b2ee413-531d-4f0b-a1f7-6ac3abcdd563.jpg', '$2b$12$YvdaZKbsdJ66MFvzygur3OtFz0vl3YmBRNOkFFGOK734kUBDFBkfe', 'admin', 1, '2026-08-31 23:52:04', '2026-11-06 17:14:42'),
(28, 'Jhoana Marie Sanchez Sumalpong', 'maiye', NULL, '09667601662', 'female', '2005-06-07', 'uploads/1789586005883-464ba852-baf0-4c54-b3f4-d92f641ba276.png', '$2b$12$shWgYAwMHJPPtqamXQ3EQugvpfgvAoMTjo9CGaXtpetOld7mb5Okm', 'farmer', 1, '2026-09-16 18:30:04', '2026-09-18 13:52:02'),
(29, 'Virlyn Garing Sandialan', 'virl', NULL, '09532002272', 'female', '2004-11-03', NULL, '$2b$12$4fJDsh19ZDIj2VwgQMQBDuoUKkcoS8qrIIEKTEWPf/ZKNp.wUG1vS', 'farmer', 0, '2026-09-18 10:49:01', '2026-09-19 15:43:08'),
(30, 'Realyn Joy Danong', 'riri', NULL, '09532674406', 'female', NULL, NULL, '$2b$12$IBcD8Jo550618d7m20xLausdaxIj5jUgsKA/B2IxfoLDjggktXfM6', 'farmer', 0, '2026-09-18 10:52:52', '2026-11-06 15:59:53'),
(39, 'Mai Mai', 'maii', NULL, '09876543211', 'female', '2010-06-15', NULL, '$2b$12$unTmOWqTOnW4xSYo5gIXLOu6/k08ZQ6QUxuq.jOz5asWhxx71jKJa', 'farmer', 1, '2026-11-06 17:04:16', '2026-11-06 17:07:37');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `agriculturists`
--
ALTER TABLE `agriculturists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_agriculturists_is_active` (`is_active`),
  ADD KEY `idx_agriculturists_barangay` (`barangay`);

--
-- Indexes for table `detections`
--
ALTER TABLE `detections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_detections_user_id` (`user_id`),
  ADD KEY `idx_detections_disease_id` (`disease_id`),
  ADD KEY `idx_detections_detected_at` (`detected_at`),
  ADD KEY `idx_detections_risk_level` (`risk_level`),
  ADD KEY `idx_detections_review_status` (`review_status`),
  ADD KEY `fk_detections_reviewed_by` (`reviewed_by`);

--
-- Indexes for table `diseases`
--
ALTER TABLE `diseases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_diseases_class_label` (`class_label`);

--
-- Indexes for table `farmers`
--
ALTER TABLE `farmers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_farmers_user_id` (`user_id`);

--
-- Indexes for table `farm_plots`
--
ALTER TABLE `farm_plots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_farm_plots_user` (`farmer_user_id`),
  ADD KEY `idx_farm_plots_purok` (`purok`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user` (`user_id`,`is_read`,`created_at`),
  ADD KEY `idx_notifications_report` (`report_id`);

--
-- Indexes for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prc_user_id` (`user_id`),
  ADD KEY `idx_prc_expires_at` (`expires_at`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reports_farmer_id` (`farmer_id`),
  ADD KEY `idx_reports_status` (`status`),
  ADD KEY `idx_reports_created_at` (`created_at`),
  ADD KEY `fk_reports_reviewed_by` (`reviewed_by`),
  ADD KEY `idx_reports_agriculturist` (`assigned_agriculturist_id`);

--
-- Indexes for table `report_images`
--
ALTER TABLE `report_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_report_images_report_id` (`report_id`),
  ADD KEY `idx_report_images_class_label` (`class_label`),
  ADD KEY `fk_report_images_detection` (`detection_id`);

--
-- Indexes for table `treatment_recommendations`
--
ALTER TABLE `treatment_recommendations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tr_disease_id` (`disease_id`),
  ADD KEY `idx_tr_is_active` (`is_active`),
  ADD KEY `fk_tr_created_by` (`created_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_username` (`username`),
  ADD UNIQUE KEY `uq_users_phone_number` (`phone_number`),
  ADD UNIQUE KEY `uq_users_email` (`email`),
  ADD KEY `idx_users_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `agriculturists`
--
ALTER TABLE `agriculturists`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `detections`
--
ALTER TABLE `detections`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=146;

--
-- AUTO_INCREMENT for table `diseases`
--
ALTER TABLE `diseases`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `farmers`
--
ALTER TABLE `farmers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `farm_plots`
--
ALTER TABLE `farm_plots`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=165;

--
-- AUTO_INCREMENT for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `report_images`
--
ALTER TABLE `report_images`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT for table `treatment_recommendations`
--
ALTER TABLE `treatment_recommendations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=169;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detections`
--
ALTER TABLE `detections`
  ADD CONSTRAINT `fk_detections_disease` FOREIGN KEY (`disease_id`) REFERENCES `diseases` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detections_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detections_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `farmers`
--
ALTER TABLE `farmers`
  ADD CONSTRAINT `fk_farmers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `farm_plots`
--
ALTER TABLE `farm_plots`
  ADD CONSTRAINT `fk_farm_plots_user` FOREIGN KEY (`farmer_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `password_reset_codes`
--
ALTER TABLE `password_reset_codes`
  ADD CONSTRAINT `fk_prc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `fk_reports_agriculturist` FOREIGN KEY (`assigned_agriculturist_id`) REFERENCES `agriculturists` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reports_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reports_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `report_images`
--
ALTER TABLE `report_images`
  ADD CONSTRAINT `fk_report_images_detection` FOREIGN KEY (`detection_id`) REFERENCES `detections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_images_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `treatment_recommendations`
--
ALTER TABLE `treatment_recommendations`
  ADD CONSTRAINT `fk_tr_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tr_disease` FOREIGN KEY (`disease_id`) REFERENCES `diseases` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
