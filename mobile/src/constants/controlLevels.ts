/**
 * The IPM "ladder" a treatment belongs to - how severe an infection
 * it is meant for. Colours match the admin web: green -> yellow ->
 * orange -> red as the infection (and the danger of the remedy)
 * gets worse.
 */

import type { ControlLevel } from '../types';

export const CONTROL_LEVEL_ORDER: ControlLevel[] = [
  'biological',
  'mechanical',
  'cultural',
  'chemical',
];

export const CONTROL_LEVEL_STYLE: Record<
  ControlLevel,
  { step: number; color: string; tint: string }
> = {
  biological: { step: 1, color: '#2a9d4b', tint: '#E6F5EA' },
  mechanical: { step: 2, color: '#C99A00', tint: '#FFF6D6' },
  cultural: { step: 3, color: '#E8761A', tint: '#FFEEDD' },
  chemical: { step: 4, color: '#D64545', tint: '#FBEAEA' },
};
