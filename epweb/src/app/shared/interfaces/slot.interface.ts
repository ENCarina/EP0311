export interface Slot {
    id: number;
    staffId: number;
    date: string;       // YYYY-MM-DD
    startTime: string;  // HH:mm:ss
    endTime: string;
    isAvailable: boolean;

    doctor?: {
        id: number;
        name: string;
        specialty?: string;
    };
    
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BulkSlotConfig {
    staffId: number;
    consultationId?: number | null; 
    startDate: string;              // YYYY-MM-DD
    endDate: string;                // YYYY-MM-DD
    startTime: string;              // HH:mm
    endTime: string;                // HH:mm
    interval: number;               // pl. 30 , 60
}