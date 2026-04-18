import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConsultationService {
  protected readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private readonly url = `${this.baseUrl}/consultations`;
  private readonly bookingUrl = `${this.baseUrl}/bookings`;

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
