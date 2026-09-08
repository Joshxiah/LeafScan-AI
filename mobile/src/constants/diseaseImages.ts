/**
 * One reference photo per disease class, shown in the Disease
 * Library list and on the Disease Detail screen.
 *
 * These are bundled with the app (not fetched), so the library
 * still has a picture with no connection. `require()` is resolved
 * by Metro at build time, so every key MUST point at a real file
 * in assets/images/diseases/.
 *
 * TO REPLACE WITH REAL PHOTOS: drop a corn-leaf photo named
 *   common_rust.png / gray_leaf_spot.png /
 *   northern_leaf_blight.png / healthy.png
 * into assets/images/diseases/ (JPG works too - update the paths
 * here if you do). The current files are placeholders.
 */

import type { ImageSourcePropType } from 'react-native';

export type DiseaseClassLabel =
  | 'common_rust'
  | 'gray_leaf_spot'
  | 'northern_leaf_blight'
  | 'healthy';

const IMAGES: Record<DiseaseClassLabel, ImageSourcePropType> = {
  common_rust: require('../../assets/images/diseases/common_rust.png'),
  gray_leaf_spot: require('../../assets/images/diseases/gray_leaf_spot.png'),
  northern_leaf_blight: require('../../assets/images/diseases/northern_leaf_blight.png'),
  healthy: require('../../assets/images/diseases/healthy.png'),
};

/** The photo for a class label, falling back to the healthy leaf for anything unknown. */
export function diseaseImage(classLabel: string | null | undefined): ImageSourcePropType {
  if (classLabel && classLabel in IMAGES) {
    return IMAGES[classLabel as DiseaseClassLabel];
  }
  return IMAGES.healthy;
}
