export interface Booking {
    id?: number;
    slotId:number;
    patientId: number;
    staffId: number;
    consultationId: number;

    name: string;   // Ezeket a Consultation interfészből vesszük át a foglaláskor
    price: number;

    startTime: string;
    endTime?: string;
    status: 'Confirmed' | 'Cancelled' | 'Completed';
    
    isPublic: boolean;
    notes?: string;

    // lekérdezéskor a backend ezeket is küldheti
    slot?: any;           
    patient?: any;
    staff?: any;

    createdAt?: string | Date;
    updatedAt?: string | Date;
}