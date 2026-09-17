/**
 * The barangays this system covers.
 *
 * A fixed, hand-maintained list (not derived from the database) -
 * the single source of truth behind the Farmers and Detections
 * barangay dropdowns/filters and the Add/Edit Farmer barangay
 * select. To add or rename a barangay, edit this file - farmers.
 * barangay / farmers.address are then expected to only ever hold
 * one of these values (or NULL).
 */
export const BARANGAYS = [
  'Alegeria',
  'Balintawak',
  'Baloyboan',
  'Banale',
  'Bulatok',
  'Dampalan',
  'Danlugan',
  'Dao',
  'Datagan',
  'Deborok',
  'Ditoray',
  'Gubang',
  'Kagawasan',
  'Kahayagan',
  'Lapidian',
  'Lenienza',
  'Lizon Valley',
  'Lower Sibatang',
  'Macasing',
] as const;
