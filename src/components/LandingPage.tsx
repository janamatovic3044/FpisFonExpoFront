import React, { useState, useEffect } from 'react';
import { getManifestacijaInfo } from '../Services/manifestacijaService';
import type { ManifestacijaInfo } from '../Services/dtos';
import { useNavigate } from 'react-router-dom';

const parseTime = (hms: string) => {
  const [h, m, s] = hms.split(':').map(Number);
  return h * 3600 + m * 60 + s;
};

const LandingPage: React.FC = () => {
  const [info, setInfo] = useState<ManifestacijaInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const baseCell: React.CSSProperties = {
    padding: '0.75rem',
    textAlign: 'center',
    borderBottom: '1px solid #444',
    borderRight: '1px solid #444',
  };

  const filledCell: React.CSSProperties = {
    ...baseCell,
    background: '#333',
    color: '#fff',
  };

  const emptyCell: React.CSSProperties = {
    ...baseCell,
    background: '#222',
    color: '#999',
  };

  // PRVA KOLONA (DATUM/TEMA) – STICKY LEVO
  const dateCellSticky: React.CSSProperties = {
    ...baseCell,
    background: '#444',
    color: '#fff',
    fontWeight: 'bold',
    position: 'sticky',
    left: 0,
    zIndex: 3,
    boxShadow: '2px 0 0 0 #444', // vizuelna ivica pri preklapanju
  };

  const headerCell: React.CSSProperties = {
    padding: '0.5rem',
    textAlign: 'center',
    borderBottom: '1px solid #444',
    borderRight: '1px solid #444',
    background: '#222',
    color: '#999',
    fontWeight: 'bold',
  };

  // GORNJI LEVI UGAO – STICKY LEVO (da prati prvu kolonu)
  const cornerHeaderCell: React.CSSProperties = {
    ...headerCell,
    position: 'sticky',
    left: 0,
    zIndex: 4,
    boxShadow: '2px 0 0 0 #222',
  };

  useEffect(() => {
    getManifestacijaInfo()
      .then(data => setInfo(data))
      .catch(() => setError('Greška pri učitavanju podataka.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Učitavanje...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '2rem' }}>{error}</div>;
  if (!info) return null;

  const allTimes = info.expoDani.flatMap(ed => ed.izlozbe.map(i => i.vremeOtvaranja));
  const uniqueTimes = Array.from(new Set(allTimes)).sort((a, b) => parseTime(a) - parseTime(b));

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `220px repeat(${uniqueTimes.length}, minmax(160px, 1fr))`,
    border: '1px solid #ccc',
    borderRadius: 8,
    // VAŽNO: bez overflow ovde, da sticky radi kako treba
    marginTop: '1.5rem',
  };


  return (
    <div style={{ width: '100%', margin: '0 auto', padding: '1rem' }}>
    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{info.naziv}</h1>
    <p style={{ margin: '0.25rem 0' }}><strong>Grad:</strong> {info.grad}</p>
    <p style={{ margin: '0.25rem 0' }}><strong>Lokacija:</strong> {info.lokacija}</p>
    <p style={{ margin: '0.25rem 0' }}>
      <strong>Datumi:</strong> {new Date(info.datumPocetka).toLocaleDateString()} – {new Date(info.datumZavrsetka).toLocaleDateString()}
    </p>
    <p style={{ margin: '1rem 0' }}>{info.dodatneInfo}</p>

      {/* Wrap sa horizontalnim skrolom za uže ekrane */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
      <div
      style={{
        ...gridStyle,
        minWidth: `${220 + uniqueTimes.length * 180}px`, // 220px za datume + 180px po koloni
      }}
    >
             {/* Gornji levi ugao: sticky levo */}
      <div style={cornerHeaderCell}></div>

      {uniqueTimes.map(time => (
        <div key={time} style={headerCell}>
          {time.substring(0, 5)}
        </div>
      ))}

          {info.expoDani.map(ed => (
            <React.Fragment key={ed.expoDanID}>
              <div style={dateCellSticky}>
                {new Date(ed.datum).toLocaleDateString('sr-RS', { weekday: 'long', day: 'numeric', month: 'long' })}
                <br /><em>{ed.tema}</em>
              </div>
              {uniqueTimes.map(time => {
                const iz = ed.izlozbe.find(i => i.vremeOtvaranja === time);
                return (
                  <div key={time} style={iz ? filledCell : emptyCell}>
                    {iz && (
                      <>
                        <div>{iz.umetnik}</div>
                        <div style={{ fontSize: '0.9rem' }}>
                          {iz.vremeOtvaranja}–{iz.vremeZatvaranja}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
        <button style={{ flex: 1, padding: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/register')}>
          Registruj se
        </button>
        <button style={{ flex: 1, padding: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/manage')}>
          Upravljaj svojom prijavom
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
