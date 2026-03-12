export interface Staff {
  id?: number;
  name: string;
  email: string;
  specialty: string;
  bio: string;
  isAvailable: boolean;
  role: string;
  image?: string;
  password?: string; // Opcionális, mert lekéréskor nem kapunk jelszót, csak küldéskor
}