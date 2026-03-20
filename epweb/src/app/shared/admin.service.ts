import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // --- Felhasználók kezelése ---

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
}