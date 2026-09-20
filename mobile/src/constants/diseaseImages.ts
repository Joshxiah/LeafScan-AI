/**
 * One reference photo per disease class, shown in the Disease
 * Library list and on the Disease Detail screen.
 *
 * These are bundled with the app (not fetched), so the library
 * still has a picture with no connection. `require()` is resolved
 * by Metro at build time, so every key MUST point at a real file
 * in assets/images/diseases/.
 *
 * Real, CC-licensed reference photos (not placeholders) - sourced
 * from university/extension plant-pathology archives:
 *   - common_rust.jpg: Univ. of Georgia Plant Pathology Archive (CC BY 3.0 US)
 *   - gray_leaf_spot.png: Daren Mueller, Iowa State Univ., via Bugwood.org (CC BY 3.0 US)
 *   - northern_leaf_blight.jpg: Margaret McGrath, Cornell Univ., via Bugwood/IPMImages (CC BY 3.0 US)
 *   - healthy.jpg: "Maisblatt", Wikimedia Commons (CC BY-SA 3.0 / GFDL)
 * To swap any of these for a different photo, just replace the file
 * under the same name - no code change needed unless the extension
 * changes too, in which case update the path below to match.
 */

import type { ImageSourcePropType } from 'react-native';

export type DiseaseClassLabel =
  | 'common_rust'
  | 'gray_leaf_spot'
  | 'northern_leaf_blight'
  | 'healthy';

const IMAGES: Record<DiseaseClassLabel, ImageSourcePropType> = {
  common_rust: require('../../assets/images/diseases/common_rust.jpg'),
  gray_leaf_spot: require('../../assets/images/diseases/gray_leaf_spot.png'),
  northern_leaf_blight: require('../../assets/images/diseases/northern_leaf_blight.jpg'),
  healthy: require('../../assets/images/diseases/healthy.jpg'),
};

/** The photo for a class label, falling back to the healthy leaf for anything unknown. */
export function diseaseImage(classLabel: string | null | undefined): ImageSourcePropType {
  if (classLabel && classLabel in IMAGES) {
    return IMAGES[classLabel as DiseaseClassLabel];
  }
  return IMAGES.healthy;
}
