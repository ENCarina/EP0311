import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BulkSlotConfig } from './interfaces/slot.interface';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class StaffService {
    protected readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl;

    getStaff() {
        return this.http.get(`${this.baseUrl}/staff`);
    }

    getConsultations() {
        return this.http.get<any>(`${this.baseUrl}/consultations`); 
    }
    getTreatmentsForStaff(staffId: number) {
        return this.http.get(`${this.baseUrl}/staff/${staffId}/treatments`);
    }
    assignTreatments(staffId: number, treatmentIds: number[]) {
        if (!staffId) throw new Error("Staff ID is required");
        return this.http.post<any>(`${this.baseUrl}/staff/${staffId}/treatments`, { treatmentIds});
    }

    bulkGenerateSlots(config: BulkSlotConfig): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/slots/bulk-generate`, config);
    }

    addStaff(staff: any) {
        return this.http.post(`${this.baseUrl}/staff`, staff);
    }

    updateStaff(id: number, data: any) {
        return this.http.put(`${this.baseUrl}/users/${id}`, data);
    }

    getAllUsers() {
        return this.http.get(`${this.baseUrl}/users`);
    }
    archiveUser(id: number) {
        return this.http.delete(`${this.baseUrl}/users/${id}`);
    }
    promoteUser(userId: number, details: any) {
        return this.http.post(`${this.baseUrl}/staff/promote`, { userId, ...details });
    }
}