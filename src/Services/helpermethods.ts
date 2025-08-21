import { jsPDF } from 'jspdf';

//PDF GENERATOR

export type PrijavaPdfData = {
  token: string;
  email: string;
  brojOsoba: number;
  expoDanIDs: number[];
  originalPrice: number;
  finalPrice: number;
  title?: string;       // npr. "Potvrda prijave" / "Ažurirana potvrda"
  issuedAt?: Date;      // custom datum, default: now
};

export function generatePrijavaPdf(data: PrijavaPdfData) {
  const {
    token,
    email,
    brojOsoba,
    expoDanIDs,
    originalPrice,
    finalPrice,
    title = 'Potvrda prijave – FON Expo 2024',
    issuedAt = new Date()
  } = data;

  const doc = new jsPDF();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text(title, 105, 18, { align: 'center' });

  doc.setFontSize(12);
  let y = 32;
  const line = (t: string) => { doc.text(t, 20, y); y += 8; };

  line(`Token: ${token}`);
  line(`Email: ${email}`);
  line(`Broj osoba: ${brojOsoba}`);
  line(`Dani (ID): ${expoDanIDs.join(', ')}`);
  line(`Originalna cena: ${originalPrice.toFixed(2)} RSD`);
  line(`Finalna cena: ${finalPrice.toFixed(2)} RSD`);
  line(`Datum izdavanja: ${issuedAt.toLocaleString('sr-RS')}`);

  doc.save(`Prijava_${token}.pdf`);
}