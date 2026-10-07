// Demo data for the onboarding/documents/housing/courses/forum screens.
// These screens have no backend yet — everything here is local/mock state,
// ported from the UniGuide.dc.html design mockup. Not part of the real API
// surface (see ../types/index.ts for that).

export type DocStatus = 'done' | 'progress' | 'todo';

export interface DocItem {
  id: string;
  title: string;
  desc: string;
  due: string;
  status: DocStatus;
}

export interface DocGroup {
  title: string;
  items: DocItem[];
}

export const docGroups: DocGroup[] = [
  {
    title: 'Before you arrive',
    items: [
      { id: 'd1', title: 'Apply for a national (D) visa', desc: 'Only required if applying from outside the EU/EEA', due: 'done', status: 'done' },
      { id: 'd2', title: 'Secure a blocked account (Sperrkonto)', desc: 'Proof of financial resources for your visa', due: 'done', status: 'done' },
      { id: 'd3', title: 'Get health insurance confirmation', desc: 'Public or private — needed for enrollment too', due: 'in 7 days', status: 'progress' },
    ],
  },
  {
    title: 'Residence permit',
    items: [
      { id: 'd4', title: "Book an appointment at the Foreigners' Office", desc: 'Ausländerbehörde — book early, slots fill fast', due: 'in 20 days', status: 'todo' },
      { id: 'd5', title: 'Prepare proof of financial resources', desc: 'Blocked account statement or scholarship letter', due: 'in 20 days', status: 'todo' },
      { id: 'd6', title: 'Submit biometric photos', desc: 'Standard biometric passport photos', due: 'in 20 days', status: 'todo' },
    ],
  },
  {
    title: 'University enrollment',
    items: [
      { id: 'd7', title: 'Complete enrollment (Immatrikulation)', desc: 'Finalizes your student status', due: 'done', status: 'done' },
      { id: 'd8', title: 'Pay semester contribution fee', desc: 'Usually €100–350 per semester', due: 'in 5 days', status: 'progress' },
      { id: 'd9', title: 'Activate your student ID card', desc: 'Also your semester transit ticket', due: 'in 30 days', status: 'todo' },
    ],
  },
];

export type RoomType = 'Studio' | 'WG/Shared' | 'Dorm';
export type PriceBand = 'low' | 'mid' | 'high';

export interface HousingListing {
  id: number;
  title: string;
  district: string;
  price: string;
  size: string;
  roomType: RoomType;
  furnished: boolean;
  priceBand: PriceBand;
}

export const housingListings: HousingListing[] = [
  { id: 1, title: 'Bright studio near TUM campus', district: 'Garching', price: '€650/mo', size: '24m²', roomType: 'Studio', furnished: true, priceBand: 'mid' },
  { id: 2, title: 'Shared flat room in Kreuzberg', district: 'Berlin-Kreuzberg', price: '€480/mo', size: '16m²', roomType: 'WG/Shared', furnished: true, priceBand: 'mid' },
  { id: 3, title: 'Modern 1-room apartment', district: 'Berlin-Mitte', price: '€820/mo', size: '32m²', roomType: 'Studio', furnished: false, priceBand: 'high' },
  { id: 4, title: 'Cozy room in student residence', district: 'Munich-Schwabing', price: '€410/mo', size: '14m²', roomType: 'Dorm', furnished: true, priceBand: 'mid' },
  { id: 5, title: 'Quiet WG room near RWTH', district: 'Aachen', price: '€390/mo', size: '15m²', roomType: 'WG/Shared', furnished: true, priceBand: 'low' },
  { id: 6, title: 'Sunny apartment close to the Alster', district: 'Hamburg', price: '€710/mo', size: '28m²', roomType: 'Studio', furnished: true, priceBand: 'high' },
];

export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export interface ScheduleRow {
  label: string;
  cells: (string | null)[];
}

export const scheduleRows: ScheduleRow[] = [
  { label: '08–10', cells: ['Mathematics', null, 'Mathematics', null, 'Technical Mechanics'] },
  { label: '10–12', cells: ['German B1', 'Thermodynamics', null, 'Thermodynamics', null] },
  { label: '12–14', cells: [null, null, 'Study Skills', null, null] },
  { label: '14–16', cells: [null, 'Technical Mechanics', null, 'German B1', null] },
];

export interface Course {
  code: string;
  name: string;
  instructor: string;
  room: string;
  credits: number;
}

export const courseList: Course[] = [
  { code: 'MATH101', name: 'Mathematics for Engineers I', instructor: 'Prof. Lang', room: 'MI 02.135', credits: 6 },
  { code: 'MECH210', name: 'Introduction to Thermodynamics', instructor: 'Dr. Hoffmann', room: 'MW 1.301', credits: 5 },
  { code: 'LANG150', name: 'German Language B1', instructor: 'Frau Weber', room: 'SPR 0.12', credits: 3 },
  { code: 'MECH110', name: 'Technical Mechanics', instructor: 'Prof. Bauer', room: 'MW 2.104', credits: 6 },
  { code: 'GEN050', name: 'Seminar: Study Skills', instructor: 'Dr. Reyes', room: 'ZB 0.08', credits: 2 },
];

export interface ForumThread {
  id: number;
  title: string;
  category: string;
  uniTag: string;
  author: string;
  replies: number;
  lastActive: string;
  excerpt: string;
  body: string;
}

export const forumThreads: ForumThread[] = [
  { id: 1, title: 'Anyone else still waiting on their blocked account confirmation?', category: 'Visa & Documents', uniTag: 'All universities', author: 'Priya S.', replies: 24, lastActive: '2h ago', excerpt: 'Sent mine three weeks ago, still nothing. Curious if this is normal or if I should call.', body: "Sent my blocked account confirmation request three weeks ago and still haven't heard back. Is this normal turnaround time, or should I be calling them directly at this point? Getting a bit nervous with my visa appointment coming up." },
  { id: 2, title: 'WG hunting in Munich — tips that actually worked', category: 'Housing', uniTag: 'TUM', author: 'Jonas M.', replies: 41, lastActive: '5h ago', excerpt: 'After two months of searching, here is what finally got me replies from landlords.', body: 'After two months of searching, here is what finally got me replies from landlords: a short video intro, being flexible on move-in date, and applying same-day. Sharing in case it helps someone else.' },
  { id: 3, title: 'TU Berlin Welcome Week 2026 — meetup thread', category: 'Social', uniTag: 'TU Berlin', author: 'Aiko T.', replies: 18, lastActive: '1d ago', excerpt: 'Anyone want to grab coffee before the first orientation session?', body: 'Anyone want to grab coffee before the first orientation session on Monday? Also happy to answer questions if you already arrived — I got here two weeks ago.' },
  { id: 4, title: 'Anmeldung appointment availability in Berlin', category: 'Visa & Documents', uniTag: 'Berlin universities', author: 'Diego R.', replies: 33, lastActive: '1d ago', excerpt: 'Sharing a trick for finding cancelled slots on the booking portal.', body: 'Sharing a trick for finding cancelled slots on the booking portal — check right after midnight, that is when most cancellations reopen.' },
  { id: 5, title: 'Dropped Thermodynamics — anyone in the same boat?', category: 'Courses', uniTag: 'RWTH Aachen', author: 'Lena K.', replies: 9, lastActive: '2d ago', excerpt: 'Considering switching sections, wondering how the workload compares.', body: 'Considering switching sections, wondering how the workload compares between the Tuesday and Thursday groups before I decide.' },
  { id: 6, title: 'Best budget grocery stores near Uni Hamburg', category: 'Social', uniTag: 'Uni Hamburg', author: 'Noor A.', replies: 15, lastActive: '3d ago', excerpt: 'Compiled a short list after a semester of comparing prices.', body: 'Compiled a short list after a semester of comparing prices — happy to share if people want the exact addresses.' },
];

export interface ForumReply {
  author: string;
  time: string;
  body: string;
  indent?: number;
}

export const forumReplies: ForumReply[] = [
  { author: 'Marta W.', time: '1h ago', body: 'Same here, mine took almost four weeks. It cleared up on its own — try not to worry too much yet.' },
  { author: 'Ben O.', time: '45m ago', body: "If it's been over four weeks I'd send a follow-up email with your reference number, that usually speeds things up." },
  { author: 'Priya S.', time: '30m ago', body: 'Thanks both — will give it another week before emailing. Appreciate it.', indent: 28 },
];

export const universities = [
  'Technical University of Munich (TUM)',
  'Humboldt University of Berlin',
  'RWTH Aachen University',
  'Heidelberg University',
  'Ludwig Maximilian University of Munich',
  'University of Hamburg',
  'TU Berlin',
  'University of Freiburg',
];

export const germanLevels = ['None / just starting', 'A1–A2 (Beginner)', 'B1–B2 (Intermediate)', 'C1–C2 (Advanced/Fluent)'];

export const statusOptions = ['Prospective applicant', 'Newly enrolled', 'Currently enrolled', 'Exchange / study abroad'];

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}
