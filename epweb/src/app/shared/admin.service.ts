import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

 // --- User Management ---

  getAllUsers(): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/users`, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  updateUser(userId: number, userData: { name: string; email: string }): Observable<any> {
  return this.http.put<{ success: boolean; message: string }>(
    `${this.apiUrl}/users/${userId}`, userData, { headers: this.getHeaders() }
  );
}

  promoteUser(userId: number, data: { specialty: string }): Observable<any> {
    const payload = {
      userId: userId,
      specialty: data.specialty
    };
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/staff/promote`, payload, { headers: this.getHeaders() });
  }
  resetPassword(userId: number, payload: any): Observable<any> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/users/${userId}/password`, payload, { headers: this.getHeaders() });
}

  archiveUser(userId: number): Observable<any> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/users/${userId}`, { headers: this.getHeaders() });
  }

  // --- Státusz és Szerepkör ---
  updateUserStatus(userId: number, isActive: boolean): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/users/${userId}/status`, { isActive }, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  updateUserRole(userId: number, roleId: number): Observable<any> {
    return this.http.post<{ success: boolean; data: any }>(`${this.apiUrl}/users/${userId}/role`, { roleId }, { headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }
  // --- Booking & Slot Management ---

  getAllBookings(onlyActive: boolean = false): Observable<any[]> {
    let params = new HttpParams();

    if (onlyActive) {
      params = params.set('active', 'true');
    }
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/bookings`, { params: params, headers: this.getHeaders() }).pipe(
      map(res => res.data)
    );
  }

  deleteBooking(bookingId: number): Observable<any> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/bookings/${bookingId}`, 
      { headers: this.getHeaders() }
    );
  }
  // --- Statistics 
  getDashboardStats(): Observable<any> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/admin/stats`, { 
      headers: this.getHeaders() 
    }).pipe(map(res => res.data));
  }
  getAllSlots(): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/slots/all`, { 
      headers: this.getHeaders() 
    }).pipe(map(res => res.data || []));
  }
  updateBookingStatus(bookingId: number, status: string): Observable<any> {
    return this.http.patch<{ success: boolean; message: string }>(
      `${this.apiUrl}/bookings/${bookingId}/status`, 
      { status }, 
      { headers: this.getHeaders() }
    );
  }
  getAllConsultations(): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/consultations`, { 
      headers: this.getHeaders() 
    }).pipe(map(res => res.data || []));
  }
}