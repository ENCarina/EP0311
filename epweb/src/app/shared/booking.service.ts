import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, catchError, throwError } from 'rxjs';
import { Booking } from './interfaces/booking.interface';
import { Slot } from './interfaces/slot.interface';

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

  getAvailableSlots(staffId: number, consultationId: number, date: string): Observable<Slot[]> {
    const params = new HttpParams()
      .set('staffId', staffId.toString())
      .set('consultationId', consultationId.toString())
      .set('date', date);

    return this.http.get<{ success: boolean; data: Slot[] }>(`${this.API_URL}/slots`, { params })
      .pipe(map(res => res.data));
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
    return this.http.delete(`${this.API_URL}/bookings/${bookingId}`, { 
      headers: this.getHeaders() 
    }).pipe(
      catchError(err => throwError(() => err))
    );
  }

  getBookingById(id: number): Observable<Booking> {
    return this.http.get<{ success: boolean; data: Booking }>(`${this.API_URL}/bookings/${id}`, {
      headers: this.getHeaders() 
    }).pipe(map(res => res.data));
  }

  updateBooking(booking: Booking): Observable<Booking> {
    return this.http.put<{ success: boolean; data: Booking }>(
      `${this.API_URL}/bookings/${booking.id}`, 
      booking,
      { headers: this.getHeaders() } 
    ).pipe(map(res => res.data));
  }
  // deleteBooking(id: number): Observable<any> {
  //   return this.http.delete(`${this.API_URL}/bookings/${id}`);
  // }
}