export interface Slot {
    id: number;
    staffId: number;
    date: string;       // YYYY-MM-DD formátumban jön
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