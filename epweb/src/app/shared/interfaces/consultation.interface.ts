export interface Consultation {
    id?: number;
    name: string;
    description: string;
    specialty: string;
    duration: number;
    price: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
}