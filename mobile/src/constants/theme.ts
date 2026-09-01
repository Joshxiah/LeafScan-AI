/**
 * Visual identity for LeafScan AI.
 *
 * Tailwind classes cover most styling, but some React Native
 * props (StatusBar colour, ActivityIndicator colour, gradient
 * stops) need real colour values rather than class names.
 */

export const colors = {
  leaf: {
    50: '#f0f9f0',
    100: '#dcf0dc',
    200: '#bbe1bb',
    300: '#8ccb8c',
    400: '#5aad5a',
    500: '#379137',
    600: '#2a752c',
    700: '#235d25',
    800: '#1f4a21',
    900: '#1a3e1d',
  },

  /** Risk level colours, matching tailwind.config.js */
  risk: {
    none: '#22c55e',
    low: '#84cc16',
    moderate: '#f59e0b',
    high: '#dc2626',
  },

  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    900: '#111827',
  },

  danger: '#dc2626',
  warning: '#f59e0b',
  success: '#22c55e',
};

/**
 * The four disease classes.
 *
 * These class_label values MUST match:
 *   - the diseases table in the database
 *   - the dataset folder names used for training (Phase 9)
 *   - the output of the prediction service (Phase 12)
 */
export const DISEASE_CLASSES = [
  'common_rust',
  'gray_leaf_spot',
  'healthy',
  'northern_leaf_blight',
] as const;

export type DiseaseClass = (typeof DISEASE_CLASSES)[number];

/**
 * Confidence level thresholds, taken directly from the project
 * document: Low 0-39%, Moderate 40-69%, High 70-100%.
 */
export const CONFIDENCE_THRESHOLDS = {
  moderate: 40,
  high: 70,
} as const;