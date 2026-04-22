import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, catchError, throwError } from 'rxjs';
import { Booking } from './interfaces/booking.interface';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

 getAvailableSlots(staffId: number, startDate: string, endDate: string, consultationId: number): Observable<any> {
    const params = new HttpParams()
      .set('staffId', staffId.toString())
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('consultationId', consultationId.toString());
  
  return this.http.get<any>(`${this.apiUrl}/slots`, { params });
  }

  generateStaffSlots(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/slots/generate`, payload, { headers: this.getHeaders()});
  }
 
  getUserBookings(onlyActive: boolean = false): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/bookings`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => res.data),
      catchError(err => throwError(() => err))
    );
  }
      
  createBooking(booking: Booking): Observable<Booking> {
    return this.http.post<{ success: boolean; data: Booking }>(`${this.apiUrl}/bookings`, booking, { headers: this.getHeaders() }
    ).pipe(map(res => res.data)
  );
  }

  cancelBooking(bookingId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/bookings/${bookingId}`, { headers: this.getHeaders() 
    }).pipe(
      catchError(err => throwError(() => err))
    );
  }
}