import type { City, GuideCategory, University } from '../types';
import { UNIVERSITY_CITY } from '../types';

export const CITIES: City[] = [
  'SIEGEN',
  'BOCHUM',
  'AACHEN',
  'DORTMUND',
  'COLOGNE',
  'DUSSELDORF',
  'MUNSTER',
  'BONN',
  'PADERBORN',
];

export const UNIVERSITIES: University[] = ['UNI_SIEGEN', 'RUB_BOCHUM', 'RWTH_AACHEN'];

export const GUIDE_CATEGORIES: GuideCategory[] = [
  'DAILY_LIFE',
  'STUDIES',
  'BUREAUCRACY',
  'ENTERTAINMENT',
  'TRAVEL',
  'HEALTHCARE',
  'OTHER',
];

// Universities that belong to the given city — drives the cascading dropdown
// (selecting a city narrows down which universities make sense to pick).
export function universitiesForCity(city: City | null | undefined): University[] {
  if (!city) return UNIVERSITIES;
  return UNIVERSITIES.filter((university) => UNIVERSITY_CITY[university] === city);
}

export function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
