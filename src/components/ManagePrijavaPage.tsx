import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './RegistrationForm.css'; // koristimo isti CSS

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const errorStyle: React.CSSProperties = {
  color: '#f87171',
  fontSize: '0.82rem',
  marginTop: '0.25rem',
  marginBottom: 0,
  lineHeight: 1
};

const ManagePrijavaPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; token?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const navigate = useNavigate();

  const validate = () => {
    const e: { email?: string; token?: string } = {};
    if (!email.trim()) e.email = 'Molimo vas unesite email adresu';
    else if (!emailRegex.test(email)) e.email = 'Unesite ispravnu email adresu';
    if (!token.trim()) e.token = 'Molimo vas unesite token';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setServerError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/registracija/Login`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), token: token.trim() })
        }
      );

      const data = await resp.json();
      if (!resp.ok) {
        setServerError(data.error?.details ?? 'Greška pri prijavi.');
      } else {
        const cleanedEmail = email.trim().toLowerCase();
        sessionStorage.setItem('lastLoginEmail', cleanedEmail);
        
        navigate('/prijava-details', { state: { prijava: data, email: cleanedEmail } });
      }
    } catch {
      setServerError('Nije moguće kontaktirati server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="rf-wrap" noValidate onSubmit={e => (e.preventDefault(), handleSubmit())}>
      {/* Back strelica */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <Link to="/" className="rf-back" title="Početna strana">
          <FaArrowLeft aria-hidden style={{ fontSize: '1.25rem' }} />
          <span className="rf-back-text">Početna strana</span>
        </Link>
      </div>

      <h2 className="rf-title">Upravljaj svojom prijavom</h2>
      <section className="rf-section">
        <h3 className="rf-subtitle">Prijava putem emaila i tokena</h3>

        <div className="rf-field">
          <label htmlFor="mp-email">Email<span className="rf-req">*</span></label>
          <input
            id="mp-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
            disabled={loading}
            className={errors.email ? 'invalid' : ''}
          />
          {errors.email && <p style={errorStyle}>{errors.email}</p>}
        </div>

        <div className="rf-field" style={{ marginTop: '0.75rem' }}>
          <label htmlFor="mp-token">Token<span className="rf-req">*</span></label>
          <input
            id="mp-token"
            type="text"
            value={token}
            onChange={e => { setToken(e.target.value); setErrors(prev => ({ ...prev, token: undefined })); }}
            disabled={loading}
            className={errors.token ? 'invalid' : ''}
          />
          {errors.token && <p style={errorStyle}>{errors.token}</p>}
        </div>

        {serverError && <p className="rf-error" role="alert" style={{ marginTop: '0.75rem' }}>{serverError}</p>}

        <div className="rf-actions">
          <button type="submit" className="rf-btn" disabled={loading}>
            {loading ? 'Učitavanje…' : 'Prijavi se'}
          </button>
        </div>
      </section>
    </form>
  );
};

export default ManagePrijavaPage;
