// Local-only onboarding answers. There is no backend field for these yet, so
// they're kept per-username in localStorage instead of being sent to the API.

export interface OnboardingData {
  name: string;
  german: string;
  university: string;
  status: string;
}

const KEY_PREFIX = 'uniguide_onboarding_';

export function loadOnboarding(username: string): OnboardingData | null {
  const raw = localStorage.getItem(KEY_PREFIX + username);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingData;
  } catch {
    return null;
  }
}

export function saveOnboarding(username: string, data: OnboardingData): void {
  localStorage.setItem(KEY_PREFIX + username, JSON.stringify(data));
}
