export interface ErrorDto { details?: string; }

export interface Izlozba {
  izlozbaID: number;
  umetnik: string;
  vremeOtvaranja: string;
  vremeZatvaranja: string;
}

export interface ExpoDan {
  expoDanID: number;
  datum: string;
  tema: string;
  izlozbe: Izlozba[];
  slobodnaMesta: number;
}

export interface ManifestacijaInfo {
  manifestacijaID: number;
  naziv: string;
  grad: string;
  lokacija: string;
  datumPocetka: string;
  datumZavrsetka: string;
  dodatneInfo: string;
  maxPosetilacaPoDanu: number;
  expoDani: ExpoDan[];
}

export interface RegistrationResponseDto {
  token: string;
  originalPrice: number;
  finalPrice: number;
  generatedPromoKod: string;
  error?: ErrorDto;
}

export interface RegistracijaRequestDTO {
  ime: string; prezime: string; profesija?: string;
  adresa1: string; adresa2?: string;
  postanskiBroj: string; mesto: string; drzava: string;
  email: string; emailPotvrdjen: boolean;
  expoDanIDs: number[]; brojOsoba: number; promoKod?: string;
}

export interface PrijavaResponseDto {
  token: string;
  statusPrijave: string;
  datumPrijave: string;
  originalPrice: number;
  finalPrice: number;
  isEarlyBird: boolean;
  brojOsoba: number;
  korisnikID: number;
  ime: string;
  prezime: string;
  isCancelled: boolean;
  expoDanIDs: number[];
  error?: ErrorDto | null;
}

export interface CenaRacunanjeDTO {
  token: string;
  brojOsoba: number;
  expoDanIDs: number[];
  promoKod?: string;
}


export interface Izlozba {
  izlozbaID: number;
  umetnik: string;
  vremeOtvaranja: string;  // ISO time string
  vremeZatvaranja: string; // ISO time string
}

export interface ExpoDan {
  expoDanID: number;
  datum: string;          // ISO date string
  tema: string;
  izlozbe: Izlozba[];
  slobodnaMesta: number;
}

export interface ManifestacijaInfo {
  manifestacijaID: number;
  naziv: string;
  grad: string;
  lokacija: string;
  datumPocetka: string;      // ISO date string
  datumZavrsetka: string;    // ISO date string
  dodatneInfo: string;
  maxPosetilacaPoDanu: number;
  expoDani: ExpoDan[];
}
export interface RegistrationResponseDto {
  token: string;
  originalPrice: number;
  finalPrice: number;
  generatedPromoKod: string;
  error?: { details?: string };
}

export interface RegistracijaRequestDTO {
  ime: string;
  prezime: string;
  profesija?: string;
  adresa1: string;
  adresa2?: string;
  postanskiBroj: string;
  mesto: string;
  drzava: string;
  email: string;
  emailPotvrdjen: boolean;
  expoDanIDs: number[];
  brojOsoba: number;
  promoKod?: string;
}
export type UpdatePrijavaDTO = {
  token: string;
  email: string;
  expoDanIDs: number[];
  brojOsoba: number;
  promoKod?: string;
};