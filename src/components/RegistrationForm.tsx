import React, { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { getManifestacijaInfo, izracunajCenu, registerPrijava } from '../Services/manifestacijaService';
import type { ManifestacijaInfo } from '../Services/dtos';
import './RegistrationForm.css';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { generatePrijavaPdf } from '../Services/helpermethods';

import { useForm } from 'react-hook-form';
import type { SubmitHandler, Resolver } from 'react-hook-form';


/* ===== Zod šema (srpske poruke) ===== */
const reqMsg = 'Molimo vas popunite ovo polje';

const errorStyle: React.CSSProperties = {
  color: 'red',
  fontSize: '0.8rem',
  marginTop: '0.25rem',
  marginBottom: '0',
  lineHeight: '1'
};

const schema = z.object({
  ime: z.string().min(1, reqMsg),
  prezime: z.string().min(1, reqMsg),
  profesija: z.string().optional(),
  adresa1: z.string().min(1, reqMsg),
  adresa2: z.string().optional(),
  postanskiBroj: z.string().min(1, reqMsg),
  mesto: z.string().min(1, reqMsg),
  drzava: z.string().min(1, reqMsg),
  email: z.string().min(1, reqMsg).email('Unesite ispravnu email adresu'),
  emailPotvrdjen: z.boolean().default(false),
  expoDanIDs: z.array(z.number()).min(1, 'Izaberite bar jedan dan'),
  brojOsoba: z.number().min(1, 'Broj osoba mora biti najmanje 1'),
  promoKod: z.string().optional()
});

type FormData = z.infer<typeof schema>;

const RegistrationForm: React.FC = () => {
  const [info, setInfo] = useState<ManifestacijaInfo | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<FormData>({
    // cast zbog mogućih razlika verzija RHF/resolvers
    resolver: zodResolver(schema) as unknown as Resolver<FormData>,
    defaultValues: {
      ime: '',
      prezime: '',
      profesija: '',
      adresa1: '',
      adresa2: '',
      postanskiBroj: '',
      mesto: '',
      drzava: '',
      email: '',
      emailPotvrdjen: false,
      expoDanIDs: [],
      brojOsoba: 1,
      promoKod: ''
    }
  });

  // Učitavanje dana
  useEffect(() => {
    getManifestacijaInfo()
      .then(setInfo)
      .catch(() => setServerError('Ne mogu učitati dane'));
  }, []);

  // Toggle dana (react-hook-form + zod)
  const selectedDays = watch('expoDanIDs');
  const toggleDay = (id: number) => {
    const curr = selectedDays || [];
    const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id];
    setValue('expoDanIDs', next, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setServerError(null);

    // 1) Izračunaj cenu pre potvrde
    let finalnaCena: number;
    try {
      finalnaCena = await izracunajCenu({
        brojOsoba: data.brojOsoba,
        expoDanIDs: data.expoDanIDs,
        promoKod: data.promoKod?.trim() || undefined,
        token: ""
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error?.details || 'Ne mogu da izračunam cenu.';
      setServerError(msg);
      alert(msg);
      return;
    }

    // 2) Poruka za potvrđivanje prijave
    const summary =
      `Potvrdite prijavu:\n` +
      `Ime: ${data.ime}\n` +
      `Prezime: ${data.prezime}\n` +
      `Adresa: ${data.adresa1}${data.adresa2 ? ', ' + data.adresa2 : ''}\n` +
      `Email: ${data.email}\n` +
      `Broj osoba: ${data.brojOsoba}\n` +
      `Dani: ${data.expoDanIDs.join(', ')}\n` +
      `Promo kod: ${data.promoKod || 'nema'}\n` +
      `\n` +
      `Finalna cena: ${finalnaCena.toFixed(2)} RSD`;

    if (!window.confirm(summary + '\n\nŽelite li nastaviti?')) return;

    // 3) Registracija
    try {
      const r = await registerPrijava(data);

      generatePrijavaPdf({
          token: r.token,
          email: data.email,
          brojOsoba: data.brojOsoba,
          expoDanIDs: data.expoDanIDs,
          originalPrice: r.originalPrice,
          finalPrice: r.finalPrice
        });

      alert(
        `Uspešno registrovano!\n` +
        `Token: ${r.token}\n` +
        `Originalna cena: ${r.originalPrice}\n` +
        `Konačna cena: ${r.finalPrice}`
      );
      reset();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.details || 'Greška pri registraciji.';
      setServerError(msg);
      alert('Greška: ' + msg);
    }
  };

  if (!info) return <div className="rf-status">Učitavanje dostupnih dana...</div>;


 


  return (
    <form className="rf-wrap" noValidate onSubmit={handleSubmit(onSubmit)}>
      {/* Back strelica */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <Link to="/" className="rf-back" title="Početna strana">
          <FaArrowLeft aria-hidden style={{ fontSize: '1.25rem' }} />
          <span className="rf-back-text">Početna strana</span>
        </Link>
      </div>

      <h2 className="rf-title">Prijava na manifestaciju</h2>

      {/* Osnovni podaci */}
      <section className="rf-section">
        <h3 className="rf-subtitle">Osnovni podaci</h3>
        <div className="rf-grid rf-grid-2">
          <div className="rf-field">
            <label htmlFor="ime">Ime<span className="rf-req">*</span></label>
            <input id="ime" {...register('ime')} className={errors.ime ? 'invalid' : ''} />
            {errors.ime && <p style={errorStyle}>{errors.ime.message}</p>}
          </div>
          <div className="rf-field">
            <label htmlFor="prezime">Prezime<span className="rf-req">*</span></label>
            <input id="prezime" {...register('prezime')} className={errors.prezime ? 'invalid' : ''} />
            {errors.prezime && <p style={errorStyle}>{errors.prezime.message}</p>}
          </div>
        </div>
        <div className="rf-field">
          <label htmlFor="profesija">Profesija</label>
          <input id="profesija" {...register('profesija')} />
        </div>
      </section>

      {/* Adresa */}
      <section className="rf-section">
        <h3 className="rf-subtitle">Adresa</h3>
        <div className="rf-field">
          <label htmlFor="adresa1">Adresa 1<span className="rf-req">*</span></label>
          <input id="adresa1" {...register('adresa1')} className={errors.adresa1 ? 'invalid' : ''} />
          {errors.adresa1 && <p style={errorStyle}>{errors.adresa1.message}</p>}
        </div>
        <div className="rf-field">
          <label htmlFor="adresa2">Adresa 2</label>
          <input id="adresa2" {...register('adresa2')} />
        </div>
        <div className="rf-grid rf-grid-3">
          <div className="rf-field">
            <label htmlFor="postanskiBroj">Poštanski broj<span className="rf-req">*</span></label>
            <input id="postanskiBroj" {...register('postanskiBroj')} className={errors.postanskiBroj ? 'invalid' : ''} />
            {errors.postanskiBroj && <p style={errorStyle}>{errors.postanskiBroj.message}</p>}
          </div>
          <div className="rf-field">
            <label htmlFor="mesto">Mesto<span className="rf-req">*</span></label>
            <input id="mesto" {...register('mesto')} className={errors.mesto ? 'invalid' : ''} />
            {errors.mesto && <p style={errorStyle}>{errors.mesto.message}</p>}
          </div>
          <div className="rf-field">
            <label htmlFor="drzava">Država<span className="rf-req">*</span></label>
            <input id="drzava" {...register('drzava')} className={errors.drzava ? 'invalid' : ''} />
            {errors.drzava && <p style={errorStyle}>{errors.drzava.message}</p>}
          </div>
        </div>
      </section>

      {/* Kontakt */}
      <section className="rf-section">
        <h3 className="rf-subtitle">Kontakt</h3>
        <div className="rf-grid rf-grid-2 rf-align-end">
          <div className="rf-field">
            <label htmlFor="email">Email<span className="rf-req">*</span></label>
            <input id="email" type="email" {...register('email')} className={errors.email ? 'invalid' : ''} />
            {errors.email && <p style={errorStyle}>{errors.email.message}</p>}
          </div>
          <div className="rf-checkbox">
            <input id="emailPotvrdjen" type="checkbox" {...register('emailPotvrdjen')} />
            <label htmlFor="emailPotvrdjen">Email potvrđen</label>
          </div>
        </div>
      </section>

      {/* Dani */}
      <section className="rf-section">
        <h3 className="rf-subtitle">Izaberite dane<span className="rf-req">*</span></h3>
        <div className="rf-days">
          {info.expoDani.map(d => (
            <label key={d.expoDanID} className={`rf-day ${selectedDays?.includes(d.expoDanID) ? 'is-selected' : ''}`}>
              <input
                type="checkbox"
                checked={!!selectedDays?.includes(d.expoDanID)}
                onChange={() => toggleDay(d.expoDanID)}
              />
              <span className="rf-day-title">
                {new Date(d.datum).toLocaleDateString('sr-RS', { day: 'numeric', month: 'long' })}
              </span>
              <span className="rf-day-sub">{d.tema}</span>
            </label>
          ))}
        </div>
        {errors.expoDanIDs && <p style={errorStyle}>{errors.expoDanIDs.message}</p>}
      </section>

      {/* Ostalo */}
      <section className="rf-section">
        <div className="rf-grid rf-grid-2">
          <div className="rf-field">
            <label htmlFor="brojOsoba">Broj osoba<span className="rf-req">*</span></label>
            <input
              id="brojOsoba"
              type="number"
              min={1}
              {...register('brojOsoba', { valueAsNumber: true })}
              className={errors.brojOsoba ? 'invalid' : ''}
            />
            {errors.brojOsoba && <p style={errorStyle}>{errors.brojOsoba.message}</p>}
          </div>
          <div className="rf-field">
            <label htmlFor="promoKod">Promo kod</label>
            <input id="promoKod" {...register('promoKod')} />
          </div>
        </div>
      </section>

      {serverError && <p className="rf-error" role="alert">{serverError}</p>}

      <div className="rf-actions">
        <button type="submit" className="rf-btn" disabled={isSubmitting}>
          {isSubmitting ? 'Šaljem…' : 'Registruj se'}
        </button>
      </div>
    </form>
  );
};

export default RegistrationForm;
