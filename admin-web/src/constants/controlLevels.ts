/**
 * The IPM "ladder" a treatment recommendation belongs to - how
 * severe an infection it is meant for. Colour coding matches the
 * mobile app: green -> yellow -> orange -> red as the infection (and
 * the danger of the remedy) gets worse.
 */

import type { ControlLevel } from '../types';

export interface ControlLevelInfo {
  level: ControlLevel;
  step: number;
  label: string;
  /** When to use it. */
  when: string;
  color: string;
  /** Soft background for badges. */
  tint: string;
}

export const CONTROL_LEVELS: ControlLevelInfo[] = [
  {
    level: 'prevention',
    step: 1,
    label: 'Prevention',
    when: 'Before planting - resistant varieties',
    color: '#2a9d4b',
    tint: '#e6f5ea',
  },
  {
    level: 'cultural',
    step: 2,
    label: 'Cultural',
    when: 'Good farm practices - rotation, residue, plant health',
    color: '#c99a00',
    tint: '#fff6d6',
  },
  {
    level: 'monitoring',
    step: 3,
    label: 'Monitoring',
    when: 'Regular field checks to catch it early',
    color: '#e8761a',
    tint: '#ffeedd',
  },
  {
    level: 'chemical',
    step: 4,
    label: 'Chemical',
    when: 'If it spreads - FPA-registered fungicide only; poisonous, follow the label',
    color: '#d64545',
    tint: '#fbeaea',
  },
];

export const CONTROL_LEVEL_BY_KEY = Object.fromEntries(
  CONTROL_LEVELS.map((info) => [info.level, info])
) as Record<ControlLevel, ControlLevelInfo>;
