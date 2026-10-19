import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { germanLevels, statusOptions, universities } from '../mock/studentHub';
import { saveOnboarding } from '../mock/onboardingStorage';

export function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.firstName ?? '');
  const [german, setGerman] = useState(germanLevels[1]);
  const [university, setUniversity] = useState(universities[0]);
  const [status, setStatus] = useState(statusOptions[0]);

  const displayName = name.trim() || 'there';

  const finish = () => {
    if (user) {
      saveOnboarding(user.username, { name, german, university, status });
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="onboarding-shell">
      <div className="auth-page">
        <div className="onboarding-dots">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className={`onboarding-dot ${n <= step ? 'onboarding-dot--active' : ''}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <div className="onboarding-step-label">Step 1 of 4</div>
            <h1>Welcome to UniGuide</h1>
            <p className="status-message" style={{ display: 'block', margin: '0.5rem 0 1.75rem' }}>
              A calm place to handle paperwork, housing, courses and everything else about
              starting university life in Germany. Takes about a minute to set up.
            </p>
            <div className="form">
              <label>
                What should we call you?
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
              </label>
              <label>
                German language level
                <select value={german} onChange={(e) => setGerman(e.target.value)}>
                  {germanLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="onboarding-actions" style={{ marginTop: '1.75rem' }}>
              <button type="button" className="button-outline" style={{ flex: 1 }} onClick={() => setStep(2)}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="onboarding-step-label">Step 2 of 4</div>
            <h1>Which university?</h1>
            <p className="status-message" style={{ display: 'block', margin: '0.5rem 0 1.75rem' }}>
              We'll tailor deadlines and guidance to your school where we can.
            </p>
            <div className="form" style={{ marginBottom: '1.75rem' }}>
              <label>
                University
                <select value={university} onChange={(e) => setUniversity(e.target.value)}>
                  {universities.map((uni) => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="onboarding-actions">
              <button type="button" className="button-secondary" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="button-outline" style={{ flex: 2 }} onClick={() => setStep(3)}>Continue</button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="onboarding-step-label">Step 3 of 4</div>
            <h1>Your student status</h1>
            <p className="status-message" style={{ display: 'block', margin: '0.5rem 0 1.5rem' }}>
              This helps us show the right visa and enrollment steps.
            </p>
            <div className="onboarding-radio-group">
              {statusOptions.map((opt) => (
                <label key={opt} className={`onboarding-radio ${status === opt ? 'onboarding-radio--checked' : ''}`}>
                  <input type="radio" name="status" checked={status === opt} onChange={() => setStatus(opt)} />
                  <span className={`onboarding-radio-dot ${status === opt ? 'onboarding-radio-dot--checked' : ''}`} />
                  {opt}
                </label>
              ))}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="button-secondary" onClick={() => setStep(2)}>Back</button>
              <button type="button" className="button-outline" style={{ flex: 2 }} onClick={() => setStep(4)}>Continue</button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="onboarding-step-label">Step 4 of 4</div>
            <h1>You're all set, {displayName}</h1>
            <p className="status-message" style={{ display: 'block', margin: '0.5rem 0 1.5rem' }}>
              Here's what we've got. You can change this anytime from your profile.
            </p>
            <div className="onboarding-summary">
              <div className="onboarding-summary-row">
                <span className="onboarding-summary-label">German level</span>
                <span>{german}</span>
              </div>
              <div className="onboarding-summary-row">
                <span className="onboarding-summary-label">University</span>
                <span>{university}</span>
              </div>
              <div className="onboarding-summary-row">
                <span className="onboarding-summary-label">Status</span>
                <span>{status}</span>
              </div>
            </div>
            <div className="onboarding-actions">
              <button type="button" className="button-secondary" onClick={() => setStep(3)}>Back</button>
              <button type="button" className="button-outline" style={{ flex: 2 }} onClick={finish}>Go to my dashboard</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
