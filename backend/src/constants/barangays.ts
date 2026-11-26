/**
 * The barangays this system covers: all 54 barangays of Pagadian City.
 *
 * A fixed, hand-maintained list (not derived from the database) -
 * the single source of truth behind the Farmers and Detections
 * barangay dropdowns/filters, the Add/Edit Farmer barangay select and
 * the agriculturist service-area picker. farmers.barangay /
 * farmers.address and agriculturist_barangays.barangay are then
 * expected to only ever hold one of these values (or NULL).
 *
 * Names are written without the "(Pob.)" poblacion suffix, in
 * alphabetical order. The count is pinned by barangays.test.ts - if
 * the city ever gains or loses a barangay, edit this list AND that
 * test. Renaming one also needs a data migration (see
 * database/fix_barangay_alegria_spelling.sql for the pattern).
 */
export const BARANGAYS = [
  'Alegria',
  'Balangasan',
  'Balintawak',
  'Baloyboan',
  'Banale',
  'Bogo',
  'Bomba',
  'Buenavista',
  'Bulatok',
  'Bulawan',
  'Dampalan',
  'Danlugan',
  'Dao',
  'Datagan',
  'Deborok',
  'Ditoray',
  'Dumagoc',
  'Gatas',
  'Gubac',
  'Gubang',
  'Kagawasan',
  'Kahayagan',
  'Kalasan',
  'Kawit',
  'La Suerte',
  'Lala',
  'Lapidian',
  'Lenienza',
  'Lizon Valley',
  'Lourdes',
  'Lower Sibatang',
  'Lumad',
  'Lumbia',
  'Macasing',
  'Manga',
  'Muricay',
  'Napolan',
  'Palpalan',
  'Pedulonan',
  'Poloyagan',
  'San Francisco',
  'San Jose',
  'San Pedro',
  'Santa Lucia',
  'Santa Maria',
  'Santiago',
  'Santo Niño',
  'Tawagan Sur',
  'Tiguma',
  'Tuburan',
  'Tulangan',
  'Tulawas',
  'Upper Sibatang',
  'White Beach',
] as const;
