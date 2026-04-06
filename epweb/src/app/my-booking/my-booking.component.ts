import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { BookingService } from '../shared/booking.service'; 
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../shared/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-my-booking',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './my-booking.component.html',
  styleUrl: './my-booking.component.css',
})
export class MyBookingComponent implements OnInit {
  bookings: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(
    private bookingService: BookingService,
    public auth: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    console.log('--- MyBooking komponens inicializálva ---');
    this.loadMyBookings();
  }

  loadMyBookings(): void {
  this.loading = true;
  this.errorMessage = '';

  this.bookingService.getUserBookings()
    .pipe(
      finalize(() => {
        console.log('HTTP kérés lezárult.');
        this.loading = false; 
      })
    )
    .subscribe({
      next: (res: any) => {
        console.log('Backend válasz megérkezett:', res);
        
        if (res && res.data) {
          this.bookings = res.data;
        } else if (Array.isArray(res)) {
          this.bookings = res;
        }
        
        console.log('Feldolgozott foglalások:', this.bookings);
      },
      error: (err: any) => {
        console.error('Hiba a foglalásoknál:', err);
        this.errorMessage = this.translate.instant('MY_BOOKINGS.ERROR_LOAD') + ' ' + (err.error?.message || '');
      }
    });
}
isPast(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const bookingDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  return bookingDate < today;
}

  canCancelBooking(booking: any): boolean {
    const bookingDate = booking?.timeSlot?.date;
    const bookingTime = booking?.timeSlot?.startTime;

    if (!bookingDate || !bookingTime) {
      return false;
    }

    const appointmentDate = this.buildAppointmentDate(bookingDate, bookingTime);
    if (isNaN(appointmentDate.getTime())) {
      return false;
    }

    const hoursDiff = (appointmentDate.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursDiff >= 24;
  }

  getCancellationHint(booking: any): string {
    return this.canCancelBooking(booking)
      ? this.translate.instant('MY_BOOKINGS.STATUS_ACTIVE')
      : this.translate.instant('MY_BOOKINGS.CANCEL_ONLY_PHONE');
  }

  cancelBooking(booking: any): void {
    const bookingId = Number(booking?.id);
    if (!bookingId) return;

    if (!this.canCancelBooking(booking)) {
      this.errorMessage = this.translate.instant('MY_BOOKINGS.CANCEL_TOOLTIP');
      return;
    }

    if (!confirm(this.translate.instant('MY_BOOKINGS.CANCEL_CONFIRM_TITLE'))) return;

    this.loading = true;
    this.errorMessage = '';
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: (res) => {
        if (res.success) {
          // Frissítjük a listát a szűrt változattal
          this.bookings = [...this.bookings.filter(b => b.id != bookingId)];
        }
        this.loading = false;
      },
      error: (err: any) => {
        this.errorMessage = err?.error?.error || err?.error?.message || this.translate.instant('MY_BOOKINGS.ERROR_CANCEL_GENERAL');
        this.loading = false;
      }
    });
  }

  private buildAppointmentDate(dateValue: string, timeValue: string): Date {
    const baseDate = new Date(dateValue);
    if (isNaN(baseDate.getTime())) {
      return new Date('invalid');
    }

    const timeText = String(timeValue || '00:00:00');
    const timeMatch = timeText.match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
    const hours = Number(timeMatch?.[1] || 0);
    const minutes = Number(timeMatch?.[2] || 0);
    const seconds = Number(timeMatch?.[3] || 0);

    return new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      seconds
    );
  }
}

