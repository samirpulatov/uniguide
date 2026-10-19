import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';

type AuthCardProps = {
  title: string;
  subtitle: string;
  helper: string;
  children: ReactNode;
};

export function AuthCard({ title, subtitle, helper, children }: AuthCardProps) {
  return (
    <div className="auth-shell">
      {/* full-viewport photo behind everything, toned down to the night palette in CSS */}
      <div className="auth-bg" aria-hidden="true" />
      <aside className="auth-intro">
        <h2 className="auth-intro-title">
          Your Study <span className="text-accent">Companion</span>
        </h2>
        <p className="auth-intro-text">
          Find guides, connect with students and make the most of your university journey.
        </p>
        <span className="accent-line auth-intro-line" aria-hidden="true" />
      </aside>
      <section className="glass-card auth-card">
        <span className="accent-line" aria-hidden="true" />
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        <p className="auth-helper">{helper}</p>
        {children}
      </section>
    </div>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function UserIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 15v2" />
    </svg>
  );
}

export function MapPinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

export function GraduationCapIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" />
      <path d="M6.5 11.5V16c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3v-4.5" />
      <path d="M21.5 9.5V14" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg {...iconProps}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function EyeIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg {...iconProps}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      {crossed && <path d="M4 4l16 16" />}
    </svg>
  );
}

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode };

export function IconInput({ icon, ...inputProps }: IconInputProps) {
  return (
    <span className="input-with-icon">
      <span className="input-icon">{icon}</span>
      <input {...inputProps} />
    </span>
  );
}

type IconSelectProps = SelectHTMLAttributes<HTMLSelectElement> & { icon: ReactNode };

// Native <select> with a leading icon and a custom chevron (the native arrow is hidden via CSS)
export function IconSelect({ icon, children, ...selectProps }: IconSelectProps) {
  return (
    <span className="input-with-icon input-with-icon--select">
      <span className="input-icon">{icon}</span>
      <select {...selectProps}>{children}</select>
      <span className="select-chevron">
        <ChevronDownIcon />
      </span>
    </span>
  );
}

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export function PasswordInput(inputProps: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="input-with-icon input-with-icon--toggle">
      <span className="input-icon">
        <LockIcon />
      </span>
      <input {...inputProps} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="input-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        <EyeIcon crossed={!visible} />
      </button>
    </span>
  );
}
