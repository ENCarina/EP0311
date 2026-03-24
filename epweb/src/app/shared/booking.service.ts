import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Booking } from './interfaces/booking.interface';
import { Slot } from './interfaces/slot.interface';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly API_URL = 'http://localhost:8000/api';
  constructor(private http: HttpClient) {}

  getAvailableSlots(staffId: number, consultationId: number, date?: string): Observable<Slot[]> {
    const params: Record<string, string> = {
      staffId: staffId.toString(),
      consultationId: consultationId.toString()
    };
    if (date) {
      params['date'] = date;
    }
    return this.http.get<Slot[]>(`${this.API_URL}/slots`, { params });
  }
      
  createBooking(booking: Booking): Observable<Booking> {
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
    });
    return this.http.post<{ success: boolean; data: Booking }>(`${this.API_URL}/bookings`, booking, { headers }).pipe(
      map(res => res.data)
    );
  }
  getBookingById(id: number): Observable<Booking> {
    return this.http.get<{ success: boolean; data: Booking }>(`${this.API_URL}/bookings/${id}`).pipe(
      map(res => res.data)
    );
  }
  updateBooking(booking: Booking): Observable<Booking> {
    return this.http.put<{ success: boolean; data: Booking }>(`${this.API_URL}/bookings/${booking.id}`, booking).pipe(
      map(res => res.data)
    );
  }
  
  deleteBooking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/bookings/${id}`);
  }
  
  getMyBookings(): Observable<any[]> {
    return this.http.get<{ success: boolean; data: Booking[] }>(`${this.API_URL}/bookings`).pipe(
      map((res: any) => Array.isArray(res) ? res : (res?.data || []))
    );
  }

  getUserBookings(): Observable<any[]> {
    return this.getMyBookings();
  }
  
  cancelBooking(bookingId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/bookings/${bookingId}`);
  }
}
