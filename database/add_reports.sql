-- ============================================================
-- LeafScan AI - Outbreak reports from farmers to the CAO
--
-- Backs the mobile app's "Submit Report to CAO" screen and the
-- admin platform's Reports page. A report is a farmer's own
-- snapshot of their recent scans (counts + a disease breakdown,
-- computed on the phone from their scan history) plus two things
-- only they know: an estimated affected area and free-text remarks.
--
-- disease_breakdown is stored as JSON rather than a child table -
-- it is a point-in-time snapshot the farmer saw when they submitted,
-- not something queried or joined against on its own.
-- ============================================================

USE leafscan_ai;

CREATE TABLE IF NOT EXISTS reports (
    id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    farmer_id               INT UNSIGNED NOT NULL,

    barangay                VARCHAR(150) DEFAULT NULL,
    municipality            VARCHAR(100) DEFAULT NULL,

    total_scans             INT UNSIGNED NOT NULL DEFAULT 0,
    affected_scans          INT UNSIGNED NOT NULL DEFAULT 0,
    healthy_scans           INT UNSIGNED NOT NULL DEFAULT 0,
    disease_breakdown       JSON DEFAULT NULL,

    estimated_area_hectares DECIMAL(6,2) DEFAULT NULL,
    remarks                 TEXT DEFAULT NULL,

    status                  ENUM('pending', 'reviewed', 'resolved') NOT NULL DEFAULT 'pending',
    reviewed_by             INT UNSIGNED DEFAULT NULL,
    reviewed_at             TIMESTAMP NULL DEFAULT NULL,

    created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_reports_farmer_id (farmer_id),
    KEY idx_reports_status (status),
    KEY idx_reports_created_at (created_at),

    CONSTRAINT fk_reports_farmer
        FOREIGN KEY (farmer_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_reports_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
