import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, catchError, throwError } from 'rxjs';
import { Booking } from './interfaces/booking.interface';
import { Slot } from './interfaces/slot.interface';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly API_URL = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

 getAvailableSlots(staffId: number, startDate: string, endDate: string, consultationId: number) {
  return this.http.get<any>(`${this.API_URL}/slots`, {
    params: { 
      staffId: staffId.toString(),
      startDate: startDate,
      endDate: endDate,
      consultationId: consultationId.toString()
    }
  });
}
  generateStaffSlots(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.API_URL}/slots/generate`, 
      payload, 
      { headers: this.getHeaders() }
    );
  }
 
  getUserBookings(): Observable<any[]> {
    console.log('Service: HTTP GET indítása a /bookings-ra');
    return this.http.get<{ success: boolean; data: any[] }>(`${this.API_URL}/bookings`, {
      headers: this.getHeaders()
    }).pipe(
      map(res => res.data),
      catchError(err => throwError(() => err))
    );
  }
      
  createBooking(booking: Booking): Observable<Booking> {
    return this.http.post<{ success: boolean; data: Booking }>(
      `${this.API_URL}/bookings`, 
      booking, 
      { headers: this.getHeaders() }
    ).pipe(map(res => res.data));
  }

  cancelBooking(bookingId: number): Observable<any> {
    console.log('Törlendő URL:', `${this.API_URL}/bookings/${bookingId}`);
    return this.http.delete(`${this.API_URL}/bookings/${bookingId}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(err => {
        return throwError(() => err);
      })
    );
  }
}