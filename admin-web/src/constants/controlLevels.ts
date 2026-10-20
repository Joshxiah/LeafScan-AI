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
    level: 'biological',
    step: 1,
    label: 'Biological',
    when: 'Light infection, about 10-20% occurrence (e.g. Trichoderma)',
    color: '#2a9d4b',
    tint: '#e6f5ea',
  },
  {
    level: 'mechanical',
    step: 2,
    label: 'Mechanical',
    when: 'Moderate infection - trim infected leaves',
    color: '#c99a00',
    tint: '#fff6d6',
  },
  {
    level: 'cultural',
    step: 3,
    label: 'Cultural',
    when: 'Spreading infection - clean the field',
    color: '#e8761a',
    tint: '#ffeedd',
  },
  {
    level: 'chemical',
    step: 4,
    label: 'Chemical',
    when: 'Severe, about 50-60% damage (IPM threshold) - poisonous, follow the label',
    color: '#d64545',
    tint: '#fbeaea',
  },
];

export const CONTROL_LEVEL_BY_KEY = Object.fromEntries(
  CONTROL_LEVELS.map((info) => [info.level, info])
) as Record<ControlLevel, ControlLevelInfo>;
