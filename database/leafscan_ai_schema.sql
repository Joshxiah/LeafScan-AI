-- ============================================================
-- LeafScan AI - Database Schema
-- A MobileNetV2-Based Corn Leaf Disease Detection and
-- Treatment Recommendation System for Farmers
--
-- Database: leafscan_ai
-- Engine:   InnoDB (required for foreign key support)
-- Charset:  utf8mb4 (supports all characters including emoji)
-- ============================================================


-- ============================================================
-- SECTION 1: CREATE THE DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS leafscan_ai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE leafscan_ai;


-- ============================================================
-- SECTION 2: DROP EXISTING TABLES (safe re-run)
-- Dropped in reverse dependency order: a table cannot be
-- dropped while another table still points at it.
-- ============================================================

DROP TABLE IF EXISTS detections;
DROP TABLE IF EXISTS treatment_recommendations;
DROP TABLE IF EXISTS password_reset_codes;
DROP TABLE IF EXISTS farmers;
DROP TABLE IF EXISTS diseases;
DROP TABLE IF EXISTS users;


-- ============================================================
-- SECTION 3: TABLE - users
-- Login credentials and identity for BOTH farmers and CAO
-- personnel. The 'role' column decides which one.
-- ============================================================

CREATE TABLE users (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    full_name       VARCHAR(150) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    phone_number    VARCHAR(20)  DEFAULT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('farmer', 'admin') NOT NULL DEFAULT 'farmer',
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SECTION 4: TABLE - farmers
-- Farming details that apply only to users with role='farmer'.
-- ONE-TO-ONE with users, enforced by UNIQUE KEY on user_id.
-- ============================================================

CREATE TABLE farmers (
    id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             INT UNSIGNED NOT NULL,
    barangay            VARCHAR(100) DEFAULT NULL,
    municipality        VARCHAR(100) DEFAULT 'Pagadian City',
    corn_type           ENUM('white', 'yellow', 'both') DEFAULT NULL,
    farm_size_hectares  DECIMAL(6,2) DEFAULT NULL,
    years_farming       INT UNSIGNED DEFAULT NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_farmers_user_id (user_id),

    CONSTRAINT fk_farmers_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SECTION 4b: TABLE - password_reset_codes
-- Short-lived 6-digit codes for the "Forgot password" flow.
-- The code itself is never stored, only its SHA-256 hash.
-- Rows are disposable; expired and used ones may be purged.
-- ============================================================

CREATE TABLE password_reset_codes (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id      INT UNSIGNED NOT NULL,
    code_hash    CHAR(64)     NOT NULL,
    expires_at   DATETIME     NOT NULL,
    consumed_at  DATETIME     DEFAULT NULL,
    attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_prc_user_id (user_id),
    KEY idx_prc_expires_at (expires_at),

    CONSTRAINT fk_prc_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SECTION 5: TABLE - diseases
-- The four classes the MobileNetV2 model can output.
--
-- class_label MUST match the dataset folder names used during
-- training in Google Colab, exactly, character for character.
-- ============================================================

CREATE TABLE diseases (
    id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    class_label         VARCHAR(50)  NOT NULL,
    display_name        VARCHAR(100) NOT NULL,
    scientific_name     VARCHAR(150) DEFAULT NULL,
    description         TEXT         DEFAULT NULL,
    symptoms            TEXT         DEFAULT NULL,
    default_risk_level  ENUM('none', 'low', 'moderate', 'high')
                        NOT NULL DEFAULT 'moderate',
    is_healthy          TINYINT(1)   NOT NULL DEFAULT 0,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_diseases_class_label (class_label)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SECTION 6: TABLE - treatment_recommendations
-- Expert-verified treatments written by CAO personnel.
-- ONE disease has MANY recommendations.
-- ============================================================

CREATE TABLE treatment_recommendations (
    id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    disease_id           INT UNSIGNED NOT NULL,
    title                VARCHAR(150) NOT NULL,
    recommendation_text  TEXT         NOT NULL,
    application_method   TEXT         DEFAULT NULL,
    preventive_measures  TEXT         DEFAULT NULL,
    created_by           INT UNSIGNED DEFAULT NULL,
    is_active            TINYINT(1)   NOT NULL DEFAULT 1,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_tr_disease_id (disease_id),
    KEY idx_tr_is_active (is_active),

    CONSTRAINT fk_tr_disease
        FOREIGN KEY (disease_id) REFERENCES diseases (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_tr_created_by
        FOREIGN KEY (created_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SECTION 7: TABLE - detections
-- One row per leaf scan. This table IS the detection history.
--
-- predicted_class stores the model's raw output permanently,
-- so historical records stay accurate even if the CAO renames
-- a disease later.
-- ============================================================

CREATE TABLE detections (
    id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id            INT UNSIGNED NOT NULL,
    disease_id         INT UNSIGNED DEFAULT NULL,
    image_path         VARCHAR(255) NOT NULL,
    predicted_class    VARCHAR(50)  NOT NULL,
    confidence_score   DECIMAL(5,2) NOT NULL,
    confidence_level   ENUM('low', 'moderate', 'high') NOT NULL,
    risk_level         ENUM('none', 'low', 'moderate', 'high') NOT NULL,
    all_probabilities  JSON         DEFAULT NULL,
    model_version      VARCHAR(50)  DEFAULT NULL,
    detected_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_detections_user_id (user_id),
    KEY idx_detections_disease_id (disease_id),
    KEY idx_detections_detected_at (detected_at),
    KEY idx_detections_risk_level (risk_level),

    CONSTRAINT fk_detections_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_detections_disease
        FOREIGN KEY (disease_id) REFERENCES diseases (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SECTION 8: SEED THE FOUR DISEASE CLASSES
--
-- Listed in ALPHABETICAL ORDER, matching the class index order
-- that the training tool will assign in Phase 10.
--
-- NOTE ON default_risk_level: the project document does not
-- define risk-level rules. The values below are PLACEHOLDERS
-- pending confirmation by the City Agriculture Office. They
-- are stored as data specifically so the CAO can change them
-- without touching any code.
-- ============================================================

INSERT INTO diseases
    (class_label, display_name, scientific_name, description, symptoms,
     default_risk_level, is_healthy)
VALUES
    ('common_rust',
     'Common Rust',
     'Puccinia sorghi',
     'A fungal disease of corn caused by Puccinia sorghi. It develops in cool, humid conditions and spreads through airborne spores.',
     'Small reddish-brown to cinnamon-brown pustules scattered on both the upper and lower leaf surfaces. Pustules rupture the leaf surface and release powdery spores.',
     'moderate',
     0),

    ('gray_leaf_spot',
     'Gray Leaf Spot',
     'Cercospora zeae-maydis',
     'A fungal disease caused by Cercospora zeae-maydis. It favors warm, humid weather and survives in corn residue left on the field.',
     'Narrow, rectangular tan to gray lesions with straight edges that run parallel to the leaf veins. Lesions may merge and blight large areas of the leaf.',
     'high',
     0),

    ('healthy',
     'Healthy Corn Leaf',
     NULL,
     'No disease symptoms detected. The leaf appears healthy.',
     'Uniform green coloration with no lesions, spots, pustules, or necrotic tissue.',
     'none',
     1),

    ('northern_leaf_blight',
     'Northern Leaf Blight',
     'Exserohilum turcicum',
     'A fungal disease caused by Exserohilum turcicum. It develops in moderate temperatures with extended periods of leaf wetness.',
     'Long, elliptical cigar-shaped gray-green to tan lesions, often several centimeters in length. Severe infection can blight the entire leaf.',
     'high',
     0);


-- ============================================================
-- END OF SCHEMA
-- ============================================================