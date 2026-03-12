import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConsultationService {
  private readonly url = 'http://localhost:8000/api/consultations';
  private readonly bookingUrl = 'http://localhost:8000/api/bookings';
  
  protected readonly http= inject(HttpClient);

  getConsultations(): Observable<any> {
    return this.http.get(this.url)
  }
  createConsultation(consultation: any): Observable<any> {
    return this.http.post(this.url, consultation);
  }
  
  updateConsultation(id:number, data:any): Observable<any> {
    return this.http.put(`${this.url}/${id}`, data);
  }
  deleteConsultation(id:number): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
  createBooking(data: any): Observable<any> {
  return this.http.post(this.bookingUrl, data);
  }
}
