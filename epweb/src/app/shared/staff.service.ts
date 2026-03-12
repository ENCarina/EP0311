import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  protected readonly http= inject(HttpClient);
    private readonly baseUrl = 'http://localhost:8000/api';

    // 2. Minden metódus a saját specifikus útvonalát használja
    getStaff() {
        return this.http.get(`${this.baseUrl}/staff`);
    }

    getConsultations() {
        return this.http.get<any>(`${this.baseUrl}/consultations`); 
    }

    addStaff(staff: any) {
        return this.http.post(`${this.baseUrl}/staff`, staff);
    }

    updateStaff(id: number, staff: any) {
        return this.http.put(`${this.baseUrl}/staff/${id}`, staff);
    }

    deleteStaff(id: number) {
        return this.http.delete(`${this.baseUrl}/staff/${id}`);
    }
}