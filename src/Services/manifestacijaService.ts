import axios from 'axios';
import type { CenaRacunanjeDTO, ManifestacijaInfo,RegistracijaRequestDTO,RegistrationResponseDto,UpdatePrijavaDTO } from './dtos';
// DTO interfaces matching backend ManifestacijaInfoDto



  // Axios instance for API calls
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  /**
   * Fetches main expo info for the landing page.
   */
  export async function getManifestacijaInfo(): Promise<ManifestacijaInfo> {
    const response = await apiClient.get<ManifestacijaInfo>('/api/manifestacija/ManifestacijaInfo');
    console.log('Fetched manifestacija info:', response.data);
    return response.data;
  }



  export const izracunajCenu = async (dto: CenaRacunanjeDTO): Promise<number> => {
    const resp = await apiClient.put<number>(`/api/registracija/IzracunajCenu`, dto);
    return resp.data;
  };



  export const registerPrijava = async (data: RegistracijaRequestDTO): Promise<RegistrationResponseDto> => {
    const resp = await apiClient.post<RegistrationResponseDto>(`/api/registracija/Registracija`, data);
    return resp.data;
  };

  
  export async function updatePrijava(dto: UpdatePrijavaDTO) {
    // predlažem endpoint: PUT /api/registracija/UpdatePrijava
    const url = `${import.meta.env.VITE_API_BASE_URL}/api/registracija/UpdatePrijava`;
    const resp = await axios.put(url, dto);
    return resp.data as any; // najbolje: tipizirati kao PrijavaResponseDto (ako backend vraća taj oblik)
  }

