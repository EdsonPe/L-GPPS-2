/**
 * Isonomia-Global Constants
 */

export const ICF_THRESHOLD = 0.75;
export const ENTROPY_MIN = 0.1;
export const ENTROPY_MAX = 3.5;

export const REGION_K_ANONYMITY_RADIUS = 100; // meters

export const EVENT_TYPES = [
  { id: 'safety', label: 'Segurança', icon: 'Shield' },
  { id: 'infrastructure', label: 'Infraestrutura', icon: 'HardHat' },
  { id: 'sanitation', label: 'Saneamento', icon: 'Droplets' },
  { id: 'lighting', label: 'Iluminação', icon: 'Sun' },
] as const;

export type EventType = typeof EVENT_TYPES[number]['id'];
