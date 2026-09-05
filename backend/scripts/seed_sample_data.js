/**
 * Seeds realistic sample analytics data: a handful of demo farmer
 * accounts, several weeks of scan history for them, and a few
 * outbreak reports in different stages of review.
 *
 * This exists so the admin Dashboard and Reports page have
 * something real to show - actual rows in `detections` and
 * `reports` - instead of the zero-everywhere state a brand new
 * database starts in. It does NOT touch any farmer account you
 * created yourself; it only adds new ones.
 *
 * Usage (run from the backend/ folder):
 *
 *   node scripts/seed_sample_data.js
 *
 * Safe to re-run: existing sample accounts are detected by
 * username and skipped rather than duplicated, though it will add
 * another round of detections/reports each time it runs. Sample
 * detections are tagged model_version = 'seed-demo' and sample
 * reports are recognisable by their farmer, so they can be told
 * apart from anything a real user submits.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const SALT_ROUNDS = 12; // must match backend/src/utils/password.ts
const DEMO_PASSWORD = 'Farmer@2026';
const MODEL_VERSION = 'seed-demo';

/** Five realistic farmer accounts across real Pagadian City barangays. */
const SAMPLE_FARMERS = [
  {
    username: 'roberto.villanueva',
    fullName: 'Roberto Villanueva',
    phone: '09181234501',
    barangay: 'Balangasan',
    cornType: 'yellow',
    farmSizeHectares: 2.4,
    yearsFarming: 14,
  },
  {
    username: 'teresita.amora',
    fullName: 'Teresita Amora',
    phone: '09181234502',
    barangay: 'Santa Lucia',
    cornType: 'white',
    farmSizeHectares: 1.1,
    yearsFarming: 8,
  },
  {
    username: 'ramon.cabahug',
    fullName: 'Ramon Cabahug',
    phone: '09181234503',
    barangay: 'Tiguma',
    cornType: 'both',
    farmSizeHectares: 3.6,
    yearsFarming: 21,
  },
  {
    username: 'ligaya.dumagan',
    fullName: 'Ligaya Dumagan',
    phone: '09181234504',
    barangay: 'San Francisco',
    cornType: 'yellow',
    farmSizeHectares: 0.8,
    yearsFarming: 5,
  },
  {
    username: 'edwin.tacastacas',
    fullName: 'Edwin Tacastacas',
    phone: '09181234505',
    barangay: 'Balangasan',
    cornType: 'yellow',
    farmSizeHectares: 1.9,
    yearsFarming: 11,
  },
];

/** How far back the scan history goes. */
const HISTORY_DAYS = 21;

const RISK_BY_CLASS = {
  common_rust: 'moderate',
  gray_leaf_spot: 'high',
  healthy: 'none',
  northern_leaf_blight: 'high',
};

function confidenceLevel(score) {
  if (score >= 70) return 'high';
  if (score >= 40) return 'moderate';
  return 'low';
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(weightedOptions) {
  const roll = Math.random();
  let cumulative = 0;
  for (const [value, weight] of weightedOptions) {
    cumulative += weight;
    if (roll < cumulative) return value;
  }
  return weightedOptions[weightedOptions.length - 1][0];
}

async function ensureFarmer(connection, farmer) {
  const [existing] = await connection.query(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [farmer.username]
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  const [userResult] = await connection.query(
    `INSERT INTO users (full_name, username, email, phone_number, password_hash, role, is_active)
     VALUES (?, ?, NULL, ?, ?, 'farmer', 1)`,
    [farmer.fullName, farmer.username, farmer.phone, passwordHash]
  );

  const userId = userResult.insertId;

  await connection.query(
    `INSERT INTO farmers (user_id, address, municipality, corn_type, farm_size_hectares, years_farming)
     VALUES (?, ?, 'Pagadian City', ?, ?, ?)`,
    [userId, farmer.barangay, farmer.cornType, farmer.farmSizeHectares, farmer.yearsFarming]
  );

  return userId;
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leafscan_ai',
  });

  const connection = await pool.getConnection();

  try {
    const [diseaseRows] = await connection.query(
      'SELECT id, class_label FROM diseases'
    );
    const diseaseIdByClass = Object.fromEntries(
      diseaseRows.map((d) => [d.class_label, d.id])
    );

    // ---------- Farmers ----------
    const farmerIds = {};
    for (const farmer of SAMPLE_FARMERS) {
      farmerIds[farmer.username] = await ensureFarmer(connection, farmer);
    }
    console.log(`Sample farmers ready: ${Object.keys(farmerIds).join(', ')}`);

    // ---------- Detections ----------
    // Everyday odds, per farmer, of scanning at all that day.
    const SCAN_CHANCE = 0.45;
    let detectionCount = 0;
    const detectionRows = [];

    for (let daysAgo = HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
      // The last 5 days carry a localised gray-leaf-spot outbreak in
      // Balangasan (Roberto and Edwin), so the dashboard's trend
      // chart and disease breakdown tell an actual story instead of
      // flat random noise.
      const inOutbreakWindow = daysAgo <= 4;

      for (const farmer of SAMPLE_FARMERS) {
        if (Math.random() > SCAN_CHANCE) continue;

        const scansToday = 1 + Math.floor(Math.random() * 2); // 1-2

        for (let i = 0; i < scansToday; i++) {
          const inOutbreak =
            inOutbreakWindow && (farmer.barangay === 'Balangasan');

          const classLabel = inOutbreak
            ? pick([
                ['gray_leaf_spot', 0.65],
                ['healthy', 0.2],
                ['common_rust', 0.1],
                ['northern_leaf_blight', 0.05],
              ])
            : pick([
                ['healthy', 0.55],
                ['common_rust', 0.18],
                ['gray_leaf_spot', 0.15],
                ['northern_leaf_blight', 0.12],
              ]);

          const confidenceScore = Number(randomBetween(80, 98).toFixed(2));
          const hour = 6 + Math.floor(Math.random() * 11); // 6am-5pm
          const minute = Math.floor(Math.random() * 60);

          detectionRows.push([
            farmerIds[farmer.username],
            diseaseIdByClass[classLabel],
            `uploads/sample/${classLabel}-${daysAgo}-${i}.jpg`,
            classLabel,
            confidenceScore,
            confidenceLevel(confidenceScore),
            RISK_BY_CLASS[classLabel],
            MODEL_VERSION,
            daysAgo,
            hour,
            minute,
          ]);
          detectionCount++;
        }
      }
    }

    for (const row of detectionRows) {
      const [
        userId, diseaseId, imagePath, predictedClass, confidenceScore,
        confLevel, riskLevel, modelVersion, daysAgo, hour, minute,
      ] = row;

      await connection.query(
        `INSERT INTO detections
           (user_id, disease_id, image_path, predicted_class, confidence_score,
            confidence_level, risk_level, model_version, detected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?,
           TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL ? DAY), MAKETIME(?, ?, 0)))`,
        [userId, diseaseId, imagePath, predictedClass, confidenceScore,
         confLevel, riskLevel, modelVersion, daysAgo, hour, minute]
      );
    }
    console.log(`Inserted ${detectionCount} sample detections over the last ${HISTORY_DAYS} days.`);

    // ---------- Reports ----------
    const sampleReports = [
      {
        farmer: 'roberto.villanueva',
        barangay: 'Balangasan',
        totalScans: 9,
        affectedScans: 7,
        healthyScans: 2,
        breakdown: [{ classLabel: 'gray_leaf_spot', displayName: 'Gray Leaf Spot', count: 7 }],
        area: 1.8,
        remarks: 'Gray leaf spot spreading fast along the eastern edge of the field this week.',
        status: 'pending',
        daysAgo: 1,
      },
      {
        farmer: 'edwin.tacastacas',
        barangay: 'Balangasan',
        totalScans: 6,
        affectedScans: 5,
        healthyScans: 1,
        breakdown: [{ classLabel: 'gray_leaf_spot', displayName: 'Gray Leaf Spot', count: 5 }],
        area: 1.2,
        remarks: 'Same symptoms as my neighbor Roberto - lesions on the lower leaves.',
        status: 'pending',
        daysAgo: 2,
      },
      {
        farmer: 'ramon.cabahug',
        barangay: 'Tiguma',
        totalScans: 5,
        affectedScans: 2,
        healthyScans: 3,
        breakdown: [{ classLabel: 'common_rust', displayName: 'Common Rust', count: 2 }],
        area: 0.6,
        remarks: 'A few rust pustules spotted, applying fungicide as advised in the app.',
        status: 'reviewed',
        daysAgo: 6,
      },
      {
        farmer: 'teresita.amora',
        barangay: 'Santa Lucia',
        totalScans: 4,
        affectedScans: 1,
        healthyScans: 3,
        breakdown: [{ classLabel: 'northern_leaf_blight', displayName: 'Northern Leaf Blight', count: 1 }],
        area: 0.3,
        remarks: 'Single affected plant, removed it right away.',
        status: 'resolved',
        daysAgo: 12,
      },
      {
        farmer: 'ligaya.dumagan',
        barangay: 'San Francisco',
        totalScans: 7,
        affectedScans: 0,
        healthyScans: 7,
        breakdown: [],
        area: null,
        remarks: 'All clear this month, just monitoring as usual.',
        status: 'resolved',
        daysAgo: 15,
      },
    ];

    const [[admin]] = await connection.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );

    function daysAgo(n) {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    }

    let reportCount = 0;
    for (const report of sampleReports) {
      const farmerId = farmerIds[report.farmer];
      const isReviewed = report.status !== 'pending';
      const reviewedAt = isReviewed ? daysAgo(Math.max(report.daysAgo - 1, 0)) : null;
      const reviewedBy = isReviewed && admin ? admin.id : null;

      await connection.query(
        `INSERT INTO reports
           (farmer_id, barangay, municipality, total_scans, affected_scans,
            healthy_scans, disease_breakdown, estimated_area_hectares, remarks,
            status, reviewed_by, reviewed_at, created_at)
         VALUES (?, ?, 'Pagadian City', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          farmerId, report.barangay, report.totalScans, report.affectedScans,
          report.healthyScans, JSON.stringify(report.breakdown), report.area,
          report.remarks, report.status, reviewedBy, reviewedAt, daysAgo(report.daysAgo),
        ]
      );
      reportCount++;
    }
    console.log(`Inserted ${reportCount} sample reports (pending / reviewed / resolved).`);

    console.log(`\nDemo farmer accounts all share the password: ${DEMO_PASSWORD}`);
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
