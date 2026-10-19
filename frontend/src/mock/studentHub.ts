// Demo data for the onboarding/documents/courses screens.
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
