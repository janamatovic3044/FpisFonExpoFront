import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import './RegistrationForm.css';
import { generatePrijavaPdf } from '../Services/helpermethods';
import { getManifestacijaInfo, izracunajCenu, updatePrijava } from '../Services/manifestacijaService';
import type { ManifestacijaInfo } from '../Services/dtos';
import type { PrijavaResponseDto } from '../Services/dtos';

/** Mali confirm modal koji koristimo i za otkazivanje i za ažuriranje */
type ConfirmProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'danger' | 'primary';
};
const ConfirmDialog: React.FC<ConfirmProps> = ({
  open,
  title,
  message,
  confirmText = 'Potvrdi',
  cancelText = 'Odustani',
  loading = false,
  onConfirm,
  onCancel,
  confirmVariant = 'primary'
}) => {
  if (!open) return null;
  const confirmClass =
    confirmVariant === 'danger' ? 'rf-btn-danger' : 'rf-btn';

  return (
    <div className="rf-modal-backdrop" onClick={onCancel}>
      <div
        className="rf-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rf-modal-title"
        aria-describedby="rf-modal-desc"
        onClick={e => e.stopPropagation()}
      >
        <h3 id="rf-modal-title" className="rf-modal-title">{title}</h3>
        <p id="rf-modal-desc" className="rf-modal-body">{message}</p>
        <div className="rf-modal-actions">
          <button type="button" className="rf-btn-ghost" onClick={onCancel} disabled={loading} autoFocus>
            {cancelText}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={loading}>
            {loading ? 'Radim…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== Stranica ======
const PrijavaDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  type LocationState = { prijava?: PrijavaResponseDto; email?: string };
  const { prijava: prijavaFromState, email: stateEmail } = (location.state as LocationState) || {};

  const [email] = useState<string>(stateEmail ?? sessionStorage.getItem('lastLoginEmail') ?? '');
  const [prijava, setPrijava] = useState<PrijavaResponseDto | null>(prijavaFromState ?? null);

  const [info, setInfo] = useState<ManifestacijaInfo | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Edit polja
  const [selectedDays, setSelectedDays] = useState<number[]>(
    // backend može da vrati expoDanIDs u Login odgovoru; ako ne, startujemo prazno
    (prijava as any)?.expoDanIDs ?? []
  );

  useEffect(() => {
    if (prijava?.expoDanIDs?.length) {
      setSelectedDays(prijava.expoDanIDs.slice());
    }
  }, [prijava]);
  const [brojOsoba, setBrojOsoba] = useState<number>(prijava?.brojOsoba ?? 1);

  // Cena
  const [priceLoading, setPriceLoading] = useState(false);
  const [newFinalPrice, setNewFinalPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Otkazivanje
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  // Ažuriranje
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cannotCancel = useMemo(() => !prijava || !email || prijava.isCancelled, [prijava, email]);
  const cannotUpdate = useMemo(
    () => !prijava || !email || prijava.isCancelled || selectedDays.length === 0 || brojOsoba < 1,
    [prijava, email, selectedDays, brojOsoba]
  );

  useEffect(() => {
    getManifestacijaInfo()
      .then(setInfo)
      .catch(() => setServerError('Ne mogu učitati dane'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proračun nove cene svaki put kad se promeni broj osoba ili dani
  useEffect(() => {
    if (!selectedDays.length || brojOsoba < 1) {
      setNewFinalPrice(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setPriceLoading(true);
      setPriceError(null);
      try {
        const val = await izracunajCenu({
          brojOsoba,
          expoDanIDs: selectedDays,
          token: prijava == null ? "" : prijava.token
        });
        if (!cancelled) setNewFinalPrice(val);
      } catch (e: any) {
        if (!cancelled) setPriceError('Ne mogu da izračunam novu cenu.');
      } finally {
        if (!cancelled) setPriceLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedDays, brojOsoba]);

  if (!prijava) {
    return (
      <div className="rf-wrap">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <button className="rf-back" onClick={() => navigate(-1)} title="Nazad">
            <FaArrowLeft aria-hidden style={{ fontSize: '1.25rem' }} />
            <span className="rf-back-text">Nazad</span>
          </button>
        </div>
        <p>Ništa nije učitano. Vratite se i pokušajte ponovo.</p>
      </div>
    );
  }

  const toggleDay = (id: number) => {
    setSelectedDays(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // ----- Otkazivanje -----
  const openConfirmCancel = () => {
    setError(null); setMessage(null);
    if (!email) { setError('Nedostaje email. Vratite se na prijavu i pokušajte ponovo.'); return; }
    setShowCancel(true);
  };
  const doCancel = async () => {
    if (!prijava || !email) return;
    setLoadingCancel(true);
    setError(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/registracija/CancelPrijava`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: prijava.token, email })
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error?.details ?? 'Greška pri otkazivanju.');
      } else {
        setPrijava(prev => prev ? { ...prev, isCancelled: true, statusPrijave: 'Otkazana' } : prev);
        setMessage('Prijava uspešno otkazana.');
        setShowCancel(false);
      }
    } catch {
      setError('Nije moguće kontaktirati server.');
    } finally {
      setLoadingCancel(false);
    }
  };

  // ----- Ažuriranje (feature 3) -----
  const openConfirmUpdate = () => {
    setError(null); setMessage(null);
    if (!email) { setError('Nedostaje email. Vratite se na prijavu i pokušajte ponovo.'); return; }
    setShowUpdate(true);
  };

  const dayLabel = (id: number) => {
    const d = info?.expoDani.find(x => x.expoDanID === id);
    if (!d) return `#${id}`;
    const datum = new Date(d.datum).toLocaleDateString('sr-RS', { day: 'numeric', month: 'long' });
    return `${datum} — ${d.tema}`;
    // npr: "15. maj — Slikarstvo"
  };

  const doUpdate = async () => {
    if (!prijava || !email) return;
    setLoadingUpdate(true);
    setError(null);
    try {
      const updated = await updatePrijava({
        token: prijava.token,
        email,
        expoDanIDs: selectedDays,
        brojOsoba
      });
      // Osveži lokalni state optimistično
      setPrijava(prev => prev ? {
        ...prev,
        brojOsoba: updated.brojOsoba ?? brojOsoba,
        finalPrice: updated.finalPrice ?? (newFinalPrice ?? prev.finalPrice),
        originalPrice: updated.originalPrice ?? prev.originalPrice,
        statusPrijave: updated.statusPrijave ?? prev.statusPrijave,
        // ako backend vrati i expoDanIDs
        ...(updated as any)?.expoDanIDs ? { ...(updated as any) } : {}
      } : prev);
      setMessage('Prijava je uspešno ažurirana.');
      generatePrijavaPdf({
        token: updated.token ?? prijava.token,
        email,
        brojOsoba: updated.brojOsoba ?? brojOsoba,
        expoDanIDs: updated.expoDanIDs ?? selectedDays,
        originalPrice: updated.originalPrice ?? prijava.originalPrice,
        finalPrice: updated.finalPrice ?? (newFinalPrice ?? prijava.finalPrice),
        title: 'Ažurirana potvrda – FON Expo 2024'
      });
      setShowUpdate(false);
    } catch (e: any) {
      setError(e?.response?.data?.error?.details ?? 'Greška pri ažuriranju prijave.');
    } finally {
      setLoadingUpdate(false);
    }
  };

  return (
    <div className="rf-wrap">
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <button className="rf-back" onClick={() => navigate('/')} title="Početna strana">
          <FaArrowLeft aria-hidden style={{ fontSize: '1.25rem' }} />
          <span className="rf-back-text">Početna strana</span>
        </button>
      </div>

      <h2 className="rf-title">Detalji prijave</h2>

      {/* Static podaci (ne-editabilni) */}
      <section className="rf-section">
        <div className="rf-grid rf-grid-2">
          <div className="rf-field">
            <label>Ime</label>
            <div>{prijava.ime}</div>
          </div>
          <div className="rf-field">
            <label>Prezime</label>
            <div>{prijava.prezime}</div>
          </div>
        </div>
        <div className="rf-grid rf-grid-3" style={{ marginTop: '0.75rem' }}>
          <div className="rf-field"><label>Token</label><div>{prijava.token}</div></div>
          <div className="rf-field"><label>Status</label><div>{prijava.statusPrijave}</div></div>
          <div className="rf-field"><label>Datum prijave</label><div>{new Date(prijava.datumPrijave).toLocaleString()}</div></div>
        </div>
      </section>

      {/* Edit: Dani + Broj osoba */}
      <section className="rf-section">
        <h3 className="rf-subtitle">Izmena izbora</h3>

        <div className="rf-field">
          <label>Izaberite dane</label>
          <div className="rf-days" style={{ marginTop: '0.5rem' }}>
            {info?.expoDani.map(d => (
              <label
                key={d.expoDanID}
                className={`rf-day ${selectedDays.includes(d.expoDanID) ? 'is-selected' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selectedDays.includes(d.expoDanID)}
                  onChange={() => toggleDay(d.expoDanID)}
                  disabled={prijava.isCancelled}
                />
                <span className="rf-day-title">
                  {new Date(d.datum).toLocaleDateString('sr-RS', { day: 'numeric', month: 'long' })}
                </span>
                <span className="rf-day-sub">{d.tema}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="rf-field" style={{ marginTop: '0.75rem', maxWidth: 240 }}>
          <label htmlFor="pd-broj">Broj osoba</label>
          <input
            id="pd-broj"
            type="number"
            min={1}
            value={brojOsoba}
            onChange={e => {
              const v = parseInt(e.target.value || '0', 10);
              setBrojOsoba(Number.isFinite(v) && v >= 1 ? v : 1);
            }}
            disabled={prijava.isCancelled}
          />
        </div>
      </section>

      {/* Cena (stara vs nova) */}
      <section className="rf-section">
        <h3 className="rf-subtitle">Cena</h3>
        <div className="rf-price">
          <div>
            <div className="rf-price-label">Stara finalna cena</div>
            <div className="rf-price-value">{prijava.finalPrice.toFixed(2)} RSD</div>
          </div>
          <div>
            <div className="rf-price-label">Nova finalna cena</div>
            <div className="rf-price-value">
              {priceLoading ? 'Računam…' :
                newFinalPrice !== null ? `${newFinalPrice.toFixed(2)} RSD` : '—'}
            </div>
          </div>
          {newFinalPrice !== null && (
            <div>
              <div className="rf-price-label">Razlika</div>
              <div className="rf-price-value">
                {(newFinalPrice - prijava.finalPrice).toFixed(2)} RSD
              </div>
            </div>
          )}
        </div>
        {priceError && <p className="rf-error" role="alert" style={{ marginTop: '0.5rem' }}>{priceError}</p>}
      </section>

      {/* Poruke */}
      {serverError && <p className="rf-error" role="alert">{serverError}</p>}
      {error && <p className="rf-error" role="alert">{error}</p>}
      {message && <p style={{ color: '#22c55e', marginTop: '0.75rem' }}>{message}</p>}

      {/* Akcije */}
      <div className="rf-actions" style={{ gap: '1rem' }}>
        <button
          className="rf-btn-danger"
          style={{ flex: 1 }}
          onClick={() => openConfirmCancel()}
          disabled={loadingCancel || cannotCancel}
          type="button"
        >
          {prijava.isCancelled ? 'Već otkazano' : 'Otkaži prijavu'}
        </button>

        <button
          className="rf-btn"
          style={{ flex: 1 }}
          onClick={() => openConfirmUpdate()}
          disabled={loadingUpdate || cannotUpdate}
          type="button"
        >
          Ažuriraj
        </button>
      </div>

      {/* Confirm modali */}
      <ConfirmDialog
        open={showCancel}
        title="Da li ste sigurni?"
        message="Otkazivanjem prijave vaš token postaje nevažeći. Nastaviti?"
        confirmText="Da, otkaži"
        cancelText="Odustani"
        loading={loadingCancel}
        onConfirm={doCancel}
        onCancel={() => !loadingCancel && setShowCancel(false)}
        confirmVariant="danger"
      />

      <ConfirmDialog
        open={showUpdate}
        title="Potvrda ažuriranja"
        message={
          `Broj osoba: ${brojOsoba}\n` +
          `Dani:\n- ${selectedDays.map(dayLabel).join('\n- ')}\n\n` +
          `Nova finalna cena: ${newFinalPrice !== null ? newFinalPrice.toFixed(2) + ' RSD' : '—'}\n\n` +
          `Želite li da sačuvate izmene?`
        }
        confirmText="Da, sačuvaj"
        cancelText="Odustani"
        loading={loadingUpdate}
        onConfirm={doUpdate}
        onCancel={() => !loadingUpdate && setShowUpdate(false)}
        confirmVariant="primary"
      />
    </div>
  );
};

export default PrijavaDetails;
