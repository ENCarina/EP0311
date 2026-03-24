import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  protected readonly http= inject(HttpClient);
    private readonly baseUrl = 'http://localhost:8000/api';

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
        if (!staffId) throw new Error("Staff ID kötelező!");
        return this.http.post<any>(`${this.baseUrl}/staff/${staffId}/treatments`, { treatmentIds});
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

    getPatients() {
        return this.http.get(`${this.baseUrl}/patients`);
    }

    archiveUser(id: number) {
        return this.http.delete(`${this.baseUrl}/users/${id}`);
    }
    promoteUser(userId: number, details: any) {
        return this.http.post(`${this.baseUrl}/staff/promote`, { userId, ...details });
}

}