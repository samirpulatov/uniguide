import type { City, ForumCategory, GuideCategory, HouseType, JobType, University } from '../types';
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

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  MINIJOB: 'Minijob',
  WERKSTUDENT: 'Werkstudent',
  PRAKTIKUM: 'Internship',
  TEILZEIT: 'Part-time',
};

export const JOB_TYPES = Object.keys(JOB_TYPE_LABELS) as JobType[];

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

// hourly wage of a job vacancy; 0 means the job is unpaid
export function formatHourlyWage(value: number): string {
  return value === 0 ? 'Unpaid' : `${formatEuro(value)}/h`;
}

export function formatArea(value: number): string {
  return `${squareMeters.format(value)} m²`;
}

// Colour family per guide/forum category, used for the card stripe and the topic tiles.
// Each name maps to a `--<name>-soft` / `--<name>-ink` token pair (violet = accent).
export type Tint = 'violet' | 'amber' | 'mint' | 'rose';

export const CATEGORY_TINT: Record<GuideCategory, Tint> = {
  BUREAUCRACY: 'violet',
  HOUSING: 'amber',
  STUDIES: 'mint',
  DAILY_LIFE: 'rose',
  ENTERTAINMENT: 'rose',
  TRAVEL: 'amber',
  HEALTHCARE: 'mint',
  OTHER: 'violet',
};
