import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { BookingService } from '../shared/booking.service'; 
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../shared/auth.service';
import Swal from 'sweetalert2';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-my-booking',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './my-booking.component.html',
  styleUrl: './my-booking.component.css',
})
export class MyBookingComponent implements OnInit {
  protected bookings: any[] = [];
  protected loading = true;
  protected errorMessage = '';

  private readonly bookingService = inject(BookingService);
  public readonly auth = inject (AuthService);
  private translate = inject(TranslateService);
  
  ngOnInit(): void {
    this.loadMyBookings();
  }

  loadMyBookings(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;

    this.loading = true;
    this.errorMessage = '';
    const todayStr = new Date().toISOString().split('T')[0];

  this.bookingService.getUserBookings()
    .pipe( finalize(() => {
        this.loading = false; 
      })
    )
    .subscribe({
      next: (res: any) => {
        let rawData = [];
          if (res && res.data) {
            rawData = res.data;
          } else if (Array.isArray(res)) {
            rawData = res;
          }

          this.bookings = rawData.filter((b: any) => {
            const bDate = b.date || b.timeSlot?.date;
            if (!bDate) return true; 

            const bookingDate = new Date(bDate);
            bookingDate.setHours(0, 0, 0, 0);

            return bDate >= todayStr;
          });
      },
      error: (err: any) => {
        const baseError = this.translate.instant('MY_BOOKINGS.ERROR_LOAD');
        const serverError = err.error?.message || '';
        this.errorMessage = `${baseError} ${serverError}`;
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

  isCancellable(booking: any): boolean {
    const slot = booking?.timeSlot;
    if (!slot?.date || !slot?.startTime) return false;

    try {
    const time = slot.startTime.slice(0, 5);
    const appointmentDate = new Date(`${slot.date}T${time}:00`);

    if (isNaN(appointmentDate.getTime())) {
      console.error('Invalid date format:', slot.date, slot.startTime);
      return false;
    }
    const now = new Date();
    const diffInMs = appointmentDate.getTime() - now.getTime();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

    return diffInMs >= twentyFourHoursInMs;
  } catch (e) {
    console.error('Error during calculation:', e);
    return false;
  }
}

  cancelBooking(id: number): void {
    if (!id) return;

    const title = this.translate.instant('MY_BOOKINGS.CANCEL_CONFIRM_TITLE');
    const text = this.translate.instant('MY_BOOKINGS.CANCEL_CONFIRM_TEXT');
    const confirmBtn = this.translate.instant('MY_BOOKINGS.CANCEL_CONFIRM_BTN');
    const cancelBtn = this.translate.instant('MY_BOOKINGS.CANCEL_CANCEL_BTN');

    Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: confirmBtn,
    cancelButtonText: cancelBtn
  }).then((result) => {
    if (result.isConfirmed) {
      this.loading = true;
      
      this.bookingService.cancelBooking(id).subscribe({
        next: (res) => {
          if (res.success) {
            this.bookings = this.bookings.filter(b => b.id !== id);
            
            Swal.fire({
              icon: 'success',
              title: this.translate.instant('MY_BOOKINGS.CANCEL_SUCCESS_TITLE'),
              text: this.translate.instant(res.message) || this.translate.instant('MY_BOOKINGS.CANCEL_SUCCESS_TEXT')
            });
          }
          this.loading = false;
        },
        error: (err) => {
          this.loading = false; 
          const backendCode = err.error?.message;
          
          const translatedMessage = this.translate.instant(`MESSAGES.${backendCode}`) || 
                            this.translate.instant('MY_BOOKINGS.ERROR_CANCEL_GENERAL');
          
          Swal.fire(
            this.translate.instant('MY_BOOKINGS.ERROR_TITLE'), 
            translatedMessage, 
            'error'
          );
        }
      });
    }
  });
}
}