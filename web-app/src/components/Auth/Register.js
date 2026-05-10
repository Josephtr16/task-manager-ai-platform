import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';
import { IoMoon, IoSunny } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tt = (key, fallback, options = {}) => t(key, { defaultValue: fallback, ...options });

  const themeToggleStyle = {
    background: isDarkMode ? 'rgba(201, 146, 74, 0.1)' : '#fff',
    borderColor: isDarkMode ? 'rgba(255,248,235,0.11)' : 'rgba(60,45,20,0.12)',
  };

  const pageBackgroundColor = isDarkMode ? '#0A0908' : '#FAF7F2';

  const validateEmail = (value) => {
    return String(value).toLowerCase().match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError(tt('authExtras.nameRequired', 'Please enter your full name.')); return; }
    if (!validateEmail(email)) { setError(tt('authExtras.invalidEmail', 'Please enter a valid email address.')); return; }
    if (password !== confirmPassword) { setError(tt('authExtras.passwordMismatch', 'Passwords do not match.')); return; }
    if (password.length < 6) { setError(tt('authExtras.passwordTooShort', 'Password must be at least 6 characters.')); return; }

    setLoading(true);
    const result = await register(name, email, password);
    if (result.success) {
      navigate('/login', { state: { message: result.message } });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const featurePills = ['Setup in 60s', 'Secure', 'AI-powered'];
  const featureIcons = ['timer', 'shield', 'spark'];

  return (
    <div className={`auth-login-page${isDarkMode ? ' dark' : ''}`} style={{ backgroundColor: pageBackgroundColor, backgroundImage: 'none' }}>

      <button
        type="button"
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        style={themeToggleStyle}
      >
        {isDarkMode ? <IoSunny size={18} color="#C9924A" /> : <IoMoon size={18} color="#7A6A55" />}
      </button>

      <div className={`auth-login-shell${isDarkMode ? ' dark' : ''}`}>
        <section className="auth-login-left">

          <div className="brand-row">
            <img src="/tudu-logo.png" alt="Tudu" className="brand-logo" />
          </div>

          <div className="login-copy">
            <h1>{tt('auth.createAccount', 'Create account')}</h1>
            <p>{tt('authExtras.startFreeWorkspace', 'Start your free workspace today.')}</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error">
              <div className="auth-alert-icon"><FaExclamationTriangle size={18} /></div>
              <div className="auth-alert-body"><p>{error}</p></div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="fields-row">
              <div className="field-group half">
                <label htmlFor="name" className="field-label">{tt('auth.fullName', 'FULL NAME')}</label>
                <div className="field-input-wrap">
                  <span className="field-icon field-icon-left" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                      <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-3.3 0-6.5 1.6-7.2 4.2a1 1 0 0 0 1 1.3h12.4a1 1 0 0 0 1-1.3C18.5 15.6 15.3 14 12 14Z" />
                    </svg>
                  </span>
                  <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={tt('authExtras.namePlaceholder', 'John Doe')} className="auth-input" required />
                </div>
              </div>

              <div className="field-group half">
                <label htmlFor="email" className="field-label">{tt('auth.email', 'EMAIL')}</label>
                <div className="field-input-wrap">
                  <span className="field-icon field-icon-left" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                      <path d="M4 6.5h16A1.5 1.5 0 0 1 21.5 8v8A1.5 1.5 0 0 1 20 17.5H4A1.5 1.5 0 0 1 2.5 16V8A1.5 1.5 0 0 1 4 6.5Zm0 1.5v.35l8 5.2 8-5.2V8H4Zm16 7V10.2l-7.58 4.93a1 1 0 0 1-1.08 0L3.75 10.2V15A.5.5 0 0 0 4 15.5h16a.5.5 0 0 0 .5-.5Z" />
                    </svg>
                  </span>
                  <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={tt('authExtras.emailPlaceholder', 'your.email@example.com')} className="auth-input" required />
                </div>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="password" className="field-label">{tt('auth.password', 'PASSWORD')}</label>
              <div className="field-input-wrap">
                <span className="field-icon field-icon-left" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <path d="M17 9.5h-1.25V7.75a3.75 3.75 0 0 0-7.5 0V9.5H7A1.5 1.5 0 0 0 5.5 11v8A1.5 1.5 0 0 0 7 20.5h10A1.5 1.5 0 0 0 18.5 19v-8A1.5 1.5 0 0 0 17 9.5Zm-2.75 0h-4.5V7.75a2.25 2.25 0 0 1 4.5 0V9.5ZM12 14a1.25 1.25 0 0 1 .5 2.4V18h-1v-1.6A1.25 1.25 0 0 1 12 14Z" />
                  </svg>
                </span>
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={tt('authExtras.passwordPlaceholder', 'Enter your password')} className="auth-input auth-input-password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="show-password-btn" tabIndex="-1">
                  {showPassword ? tt('common.hide', 'Hide') : tt('common.show', 'Show')}
                </button>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword" className="field-label">{tt('auth.confirmPassword', 'CONFIRM PASSWORD')}</label>
              <div className="field-input-wrap">
                <span className="field-icon field-icon-left" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                    <path d="M17 9.5h-1.25V7.75a3.75 3.75 0 0 0-7.5 0V9.5H7A1.5 1.5 0 0 0 5.5 11v8A1.5 1.5 0 0 0 7 20.5h10A1.5 1.5 0 0 0 18.5 19v-8A1.5 1.5 0 0 0 17 9.5Zm-2.75 0h-4.5V7.75a2.25 2.25 0 0 1 4.5 0V9.5ZM12 14a1.25 1.25 0 0 1 .5 2.4V18h-1v-1.6A1.25 1.25 0 0 1 12 14Z" />
                  </svg>
                </span>
                <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={tt('authExtras.confirmPasswordPlaceholder', 'Confirm your password')} className="auth-input auth-input-password" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="show-password-btn" tabIndex="-1">
                  {showConfirmPassword ? tt('common.hide', 'Hide') : tt('common.show', 'Show')}
                </button>
              </div>
            </div>

            <button type="submit" className={`login-submit-btn${loading ? ' is-loading' : ''}`} disabled={loading}>
              {loading ? (
                <><span className="spinner" />{tt('authExtras.creatingAccount', 'Creating account...')}</>
              ) : (
                <>{tt('auth.createAccount', 'Create account')}<FaArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="footer-row">
            <p>{tt('authExtras.alreadyHaveAccount', 'Already have an account?')}{' '}<Link to="/login">{tt('auth.login', 'Log in')}</Link></p>
          </div>
        </section>

        <div className="v-div" aria-hidden="true" />

        <section className="auth-login-right">
          <div className="right-block">
            <h2>
              <span>Your workspace,</span>
              <span>starts here.</span>
            </h2>
            <p>Join thousands of teams who plan smarter with AI-driven prioritization, Kanban boards, and productivity insights.</p>

            <div className="feature-pills">
              {featurePills.map((pill, idx) => (
                <span className="feature-pill" key={pill}>
                  <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true" className="pill-icon">
                    {featureIcons[idx] === 'spark' && <path d="M8 1.4 9.6 5l3.6 1.6-3.6 1.6L8 11.8 6.4 8.2 2.8 6.6 6.4 5 8 1.4Z" />}
                    {featureIcons[idx] === 'timer' && <path d="M7 2h2v1.2a5.5 5.5 0 1 1-2 0V2Zm1 3a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Zm-.5 1.5h1v2.7l1.9 1.1-.5.9-2.4-1.4V6.5Z" />}
                    {featureIcons[idx] === 'shield' && <path d="M8 1.2 13.5 3v4.1c0 3.1-1.9 5.7-5.5 7.7C4.4 12.8 2.5 10.2 2.5 7.1V3L8 1.2Zm0 1.6L3.7 4.2v2.9c0 2.5 1.4 4.6 4.3 6.3 2.9-1.7 4.3-3.8 4.3-6.3V4.2L8 2.8Z" />}
                  </svg>
                  <span>{pill}</span>
                </span>
              ))}
            </div>

            <svg viewBox="0 0 520 200" className={`dashboard-illustration${isDarkMode ? ' dark-illustration' : ''}`} aria-hidden="true">
              <path className="ill-floating-bg" d="M25,158 Q5,85 90,60 Q185,34 260,48 Q355,32 455,68 Q520,102 498,158 Q476,188 260,194 Q35,194 25,158Z" fill="#EAE2D5" opacity="0.65" />
              <circle cx="478" cy="46" r="18" fill="#DDD0BC" opacity="0.4" />
              <circle cx="42" cy="54" r="12" fill="#DDD0BC" opacity="0.34" />
              <circle cx="494" cy="168" r="12" fill="#DDD0BC" opacity="0.28" />
              <rect x="148" y="22" width="226" height="152" rx="12" fill="#FFFFFF" opacity="0.97" />
              <rect x="148" y="22" width="226" height="28" rx="12" fill="#C9924A" opacity="0.9" />
              <rect x="148" y="38" width="226" height="12" fill="#C9924A" opacity="0.9" />
              <circle cx="164" cy="36" r="3.4" fill="#FFF8F0" opacity="0.95" />
              <circle cx="176" cy="36" r="3.4" fill="#FFF8F0" opacity="0.72" />
              <circle cx="188" cy="36" r="3.4" fill="#FFF8F0" opacity="0.55" />
              <rect x="214" y="33" width="88" height="7" rx="3.5" fill="#FFF8F0" opacity="0.75" />
              <rect x="168" y="62" width="84" height="10" rx="5" fill="#E9DED0" />
              <rect x="168" y="78" width="46" height="6" rx="3" fill="#C9924A" opacity="0.78" />
              <rect x="168" y="88" width="52" height="4" rx="2" fill="#E9DED0" />
              <rect x="266" y="62" width="44" height="46" rx="8" fill="#F9F6F1" />
              <rect x="316" y="62" width="44" height="46" rx="8" fill="#F9F6F1" />
              <rect x="266" y="112" width="44" height="20" rx="6" fill="#F9F6F1" />
              <rect x="316" y="112" width="44" height="20" rx="6" fill="#F9F6F1" />
              <rect x="274" y="71" width="18" height="4" rx="2" fill="#C9924A" opacity="0.72" />
              <rect x="274" y="80" width="26" height="6" rx="3" fill="#E1D3C0" />
              <rect x="324" y="71" width="18" height="4" rx="2" fill="#C9924A" opacity="0.72" />
              <rect x="324" y="80" width="26" height="6" rx="3" fill="#E1D3C0" />
              <rect x="274" y="122" width="18" height="4" rx="2" fill="#C9924A" opacity="0.72" />
              <rect x="324" y="122" width="18" height="4" rx="2" fill="#C9924A" opacity="0.72" />
              <rect x="162" y="120" width="92" height="44" rx="6" fill="#F9F6F1" />
              <rect x="170" y="128" width="10" height="10" rx="2" fill="#FFF" stroke="#C9924A" strokeWidth="1" />
              <rect x="186" y="129" width="50" height="5" rx="2.5" fill="#C9B8A0" />
              <rect x="186" y="138" width="35" height="4" rx="2" fill="#E0D6C9" />
              <rect x="170" y="144" width="10" height="10" rx="2" fill="#FFF" stroke="#C9924A" strokeWidth="1" />
              <rect x="186" y="145" width="44" height="5" rx="2.5" fill="#C9B8A0" />
              <rect x="260" y="120" width="100" height="44" rx="6" fill="#FFF8F0" stroke="#C9924A" strokeWidth="0.8" opacity="0.95" />
              <circle cx="275" cy="134" r="8" fill="#C9924A" opacity="0.18" />
              <circle cx="275" cy="134" r="4.6" fill="#C9924A" opacity="0.9" />
              <rect x="288" y="128" width="42" height="5" rx="2.5" fill="#C9B8A0" />
              <rect x="288" y="137" width="52" height="4" rx="2" fill="#E0D6C9" />
              <rect x="288" y="145" width="28" height="4" rx="2" fill="#E0D6C9" />
              <rect className="ill-floating-card" x="24" y="65" width="104" height="116" rx="10" fill="#FFFFFF" opacity="0.92" />
              <rect x="36" y="79" width="54" height="7" rx="3.5" fill="#C9B8A0" />
              <rect x="36" y="92" width="76" height="26" rx="6" fill="#F9F6F1" />
              <rect x="42" y="100" width="10" height="10" rx="2" fill="#FFF" stroke="#C9924A" strokeWidth="1" />
              <rect x="58" y="100" width="40" height="5" rx="2.5" fill="#C9B8A0" />
              <rect x="42" y="112" width="50" height="4" rx="2" fill="#E0D6C9" />
              <rect x="36" y="124" width="76" height="26" rx="6" fill="#FFF8F0" stroke="#C9924A" strokeWidth="0.8" />
              <rect x="42" y="132" width="10" height="10" rx="2" fill="#FFF" stroke="#C9924A" strokeWidth="1" />
              <rect x="58" y="132" width="36" height="5" rx="2.5" fill="#C9B8A0" />
              <rect x="42" y="144" width="44" height="4" rx="2" fill="#E0D6C9" />
              <rect x="36" y="156" width="76" height="12" rx="6" fill="#F9F6F1" />
              <rect className="ill-floating-card" x="394" y="55" width="104" height="118" rx="10" fill="#FFFFFF" opacity="0.93" />
              <rect x="406" y="68" width="38" height="6" rx="3" fill="#C9B8A0" />
              <rect x="406" y="80" width="14" height="76" rx="7" fill="#E8DFD0" />
              <rect x="424" y="90" width="14" height="66" rx="7" fill="#E8DFD0" />
              <rect x="442" y="76" width="14" height="80" rx="7" fill="#E8DFD0" />
              <rect x="460" y="84" width="14" height="72" rx="7" fill="#E8DFD0" />
              <rect x="478" y="96" width="14" height="60" rx="7" fill="#E8DFD0" />
              <rect x="406" y="134" width="86" height="1.4" fill="#C9B8A0" opacity="0.65" />
              <circle cx="466" cy="92" r="18" fill="none" stroke="#C9924A" strokeWidth="3" strokeDasharray="74 26" strokeLinecap="round" opacity="0.9" />
              <circle cx="466" cy="92" r="11" fill="#FFF" opacity="0.96" />
              <rect x="458" y="90" width="16" height="4" rx="2" fill="#C9924A" opacity="0.78" />
              <rect x="192" y="5" width="100" height="17" rx="8" fill="#FFFFFF" opacity="0.92" />
              <circle cx="206" cy="13.5" r="3" fill="#C9924A" />
              <rect x="214" y="10.5" width="64" height="6" rx="3" fill="#C9B8A0" />
              <rect x="298" y="180" width="110" height="18" rx="9" fill="#FFFFFF" opacity="0.92" />
              <circle cx="312" cy="189" r="3" fill="#C9924A" />
              <rect x="320" y="185" width="70" height="6" rx="3" fill="#C9B8A0" />
            </svg>
          </div>
        </section>
      </div>

      <style>{`
        html, body, #root { height: 100vh; overflow: hidden; background: transparent; }
        body { margin: 0; background-image: none !important; }

        .auth-login-page {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          color: #1A1208;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .auth-login-shell {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: stretch;
          height: 100vh;
          width: 100%;
        }

        .auth-login-left {
          width: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 10% 0 10%;
          z-index: 2;
          min-width: 420px;
        }

        .brand-row {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 32px;
        }

        .brand-logo {
          height: 72px;
          width: auto;
        }

        .login-copy h1 {
          margin: 0 0 6px 0;
          font-family: 'Fraunces', serif;
          font-size: 60px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          font-weight: 700;
          color: #1A1208;
        }

        .login-copy p {
          margin: 0 0 28px 0;
          font-size: 15px;
          line-height: 1.7;
          color: #6B5E4A;
        }

        .auth-alert {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 14px 15px;
          border-radius: 14px;
          margin-bottom: 16px;
          animation: loginFadeUp 0.28s ease-out;
        }

        .auth-alert-error { background: rgba(255, 248, 240, 0.94); border: 1px solid rgba(201, 146, 74, 0.2); }
        .auth-alert-icon { color: #C9924A; margin-top: 1px; flex: 0 0 auto; }
        .auth-alert p { margin: 0; font-size: 14px; line-height: 1.55; color: #5A4A38; }
        .auth-alert-body { flex: 1; }

        .auth-form { display: flex; flex-direction: column; gap: 16px; }

        .fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .field-group { display: flex; flex-direction: column; gap: 10px; }

        .field-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.07em;
          color: #6B5E4A;
          text-transform: uppercase;
        }

        .field-input-wrap { position: relative; }

        .auth-input {
          width: 100%;
          background: #FFFFFF;
          border: 1.5px solid rgba(60, 45, 20, 0.12);
          border-radius: 11px;
          padding: 15px 13px 15px 40px;
          font-size: 14px;
          color: #1A1208;
          outline: none;
          transition: border-color 150ms ease, box-shadow 150ms ease;
          font-family: inherit;
        }

        .auth-input::placeholder { color: #A8977E; }
        .auth-input:focus { border-color: #C9924A; box-shadow: 0 0 0 3px rgba(201, 146, 74, 0.12); }
        .auth-input-password { padding-right: 76px; }

        .field-icon {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .field-icon-left { left: 13px; width: 16px; height: 16px; color: rgba(201, 146, 74, 0.55); }
        .field-icon-left svg { width: 16px; height: 16px; fill: currentColor; }

        .show-password-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: 0;
          background: transparent;
          padding: 7px 9px;
          border-radius: 8px;
          color: #8B745B;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .login-submit-btn {
          width: 100%;
          margin-top: 2px;
          padding: 16px;
          border: 0;
          border-radius: 11px;
          background: #C9924A;
          color: #FFFFFF;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: opacity 150ms ease, transform 150ms ease, box-shadow 150ms ease;
          box-shadow: 0 10px 24px rgba(201, 146, 74, 0.16);
        }

        .login-submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
        .login-submit-btn:disabled { opacity: 0.72; cursor: not-allowed; }
        .login-submit-btn.is-loading { cursor: progress; }

        .spinner {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.35);
          border-top-color: #FFFFFF;
          animation: loginSpin 0.8s linear infinite;
        }

        .footer-row { margin-top: 18px; font-size: 13px; color: #8A8070; }
        .footer-row p { margin: 0; }
        .footer-row a { color: #B07A2A; font-weight: 600; text-decoration: none; }

        .v-div { width: 1px; margin: 8vh 0; background: rgba(60, 45, 20, 0.12); flex: 0 0 auto; }

        .auth-login-right {
          position: relative;
          width: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5%;
          z-index: 2;
          overflow: hidden;
        }

        .auth-login-left, .auth-login-right, .auth-login-shell { position: relative; z-index: 2; }

        .right-block {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 700px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .right-block h2 {
          margin: 0 0 12px 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-family: 'Fraunces', serif;
          font-size: clamp(38px, 4.8vw, 64px);
          line-height: 1.02;
          letter-spacing: -0.03em;
          font-weight: 600;
          color: #C9924A;
        }

        .right-block h2 span:first-child { color: #1A1208; }
        .right-block p { margin: 0 0 20px 0; max-width: 460px; font-size: 15px; line-height: 1.75; color: #6B5E4A; }

        .feature-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 30px; }

        .feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 12px;
          border-radius: 20px;
          background: #FFFFFF;
          border: 1px solid rgba(60, 45, 20, 0.12);
          color: #5A4A38;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        }

        .pill-icon { width: 14px; height: 14px; fill: #C9924A; flex: 0 0 auto; }
        .dashboard-illustration { width: 100%; height: 270px; display: block; overflow: visible; }

        .theme-toggle-btn {
          position: fixed;
          top: 20px;
          right: 24px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1.5px solid rgba(60, 45, 20, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 150ms ease;
          z-index: 100;
          padding: 0;
        }

        .theme-toggle-btn:hover { border-color: #C9924A; }

        /* ── DARK MODE ── */
        .dark.auth-login-page { color: #F5F0E8; }
        .dark.auth-login-page .login-copy h1 { color: #F5F0E8; }
        .dark.auth-login-page .login-copy p { color: #C9924A; }
        .dark.auth-login-page .field-label { color: #4A4540; }
        .dark.auth-login-page .footer-row a { color: #C9924A; }
        .dark.auth-login-page .footer-row { color: #8A8070; }
        .dark.auth-login-page .auth-input { background: #1C1A18; border-color: rgba(255, 248, 235, 0.06); color: #F5F0E8; }
        .dark.auth-login-page .auth-input::placeholder { color: #4A4540; }
        .dark.auth-login-page .auth-input:focus { border-color: rgba(255, 248, 235, 0.20); box-shadow: 0 0 0 3px rgba(201, 149, 74, 0.12); }
        .dark.auth-login-page .show-password-btn { color: #8A8070; }
        .dark.auth-login-page .login-submit-btn { box-shadow: 0 10px 24px rgba(201, 146, 74, 0.18); }
        .dark.auth-login-page .v-div { background: rgba(255, 248, 235, 0.06); }
        .dark.auth-login-page .theme-toggle-btn { background: rgba(201, 146, 74, 0.1); border-color: rgba(255, 248, 235, 0.11); }
        .dark.auth-login-page .theme-toggle-btn:hover { border-color: #C9924A; }
        .dark.auth-login-page .right-block h2 span:first-child { color: #F5F0E8; }
        .dark.auth-login-page .right-block p { color: #8A8070; }
        .dark.auth-login-page .feature-pill { background: rgba(255, 248, 235, 0.04); border-color: rgba(255, 248, 235, 0.06); color: #8A8070; }
        .dark.auth-login-page .auth-alert-error { background: #1C1A18; border-color: rgba(255, 248, 235, 0.06); }
        .dark.auth-login-page .auth-alert p { color: #F5F0E8; }

        .dark.auth-login-page .dark-illustration [fill="#FFFFFF"],
        .dark.auth-login-page .dark-illustration [fill="#fff"],
        .dark.auth-login-page .dark-illustration [fill="#F9F6F1"],
        .dark.auth-login-page .dark-illustration [fill="#FFF8F0"] { fill: #1C1A18 !important; }
        .dark.auth-login-page .dark-illustration [fill="#EAE2D5"],
        .dark.auth-login-page .dark-illustration [fill="#E9DED0"],
        .dark.auth-login-page .dark-illustration [fill="#E8DFD0"],
        .dark.auth-login-page .dark-illustration [fill="#E1D3C0"],
        .dark.auth-login-page .dark-illustration [fill="#E0D6C9"],
        .dark.auth-login-page .dark-illustration [fill="#DDD0BC"],
        .dark.auth-login-page .dark-illustration [fill="#C9B8A0"] { fill: #242220 !important; }
        .dark.auth-login-page .dark-illustration .ill-floating-bg { fill: #121110 !important; opacity: 0.9; }
        .dark.auth-login-page .dark-illustration .ill-floating-card { fill: #121110 !important; stroke: rgba(255,248,235,0.06); stroke-width: 1; }

        @media (max-width: 1200px) {
          .auth-login-left { padding: 0 6% 0 6%; }
          .login-copy h1 { font-size: 52px; }
        }

        @media (max-width: 980px) {
          .auth-login-shell { flex-direction: column; }
          .v-div { display: none; }
          .auth-login-left, .auth-login-right { width: 100%; min-width: 0; }
          .auth-login-left { padding: 80px 8% 40px 8%; }
          .auth-login-right { padding: 20px 8% 60px 8%; }
        }

        @media (max-width: 680px) {
          .fields-row { grid-template-columns: 1fr; }
          .login-copy h1 { font-size: 44px; }
        }

        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes loginSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Register;