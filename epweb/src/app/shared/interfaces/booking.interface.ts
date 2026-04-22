export interface Booking {
    id?: number;
    slotId:number;
    patientId: number;
    staffId: number;
    consultationId: number;
    name: string;   
    price: number;
    startTime: string;
    endTime?: string;
    status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';
    isPublic: boolean;
    notes?: string;
    slot?: any;           
    patient?: any;
    staff?: any;

    createdAt?: string | Date;
    updatedAt?: string | Date;
}