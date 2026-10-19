import type { City, ForumCategory, GuideCategory, HouseType, University } from '../types';
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
  'HOUSING',
  'OTHER',
];

export const FORUM_CATEGORIES: ForumCategory[] = [
  'DAILY_LIFE',
  'STUDIES',
  'BUREAUCRACY',
  'ENTERTAINMENT',
  'TRAVEL',
  'HEALTHCARE',
  'HOUSING',
  'OTHER',
];

export const HOUSE_TYPE_LABELS: Record<HouseType, string> = {
  WG_ROOM: 'WG room',
  APARTMENT: 'Apartment',
  DORM: 'Dorm',
};

export const HOUSE_TYPES = Object.keys(HOUSE_TYPE_LABELS) as HouseType[];

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

// Backend sends LocalDateTime without a zone (e.g. "2026-10-05T12:34:56.789"), parsed as local time.
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function initialsOf(name: string): string {
  return name.slice(0, 2).toUpperCase() || '?';
}

// "today", "1 day ago", "5 days ago", then a plain date for anything older than a month
export function timeAgo(value: string): string {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  return new Date(value).toLocaleDateString();
}

const euro = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const squareMeters = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });

export function formatEuro(value: number): string {
  return `€${euro.format(value)}`;
}

export function formatArea(value: number): string {
  return `${squareMeters.format(value)} m²`;
}
