import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../shared/admin.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.css',
})
export class BookingListComponent implements OnInit {
  private adminService = inject(AdminService);
  public translate = inject(TranslateService);

  bookings = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  showOnlyActive = signal<boolean>(false);

  ngOnInit(): void {
    this.loadBookings();
  }

  //Összes foglalás betöltése 
  loadBookings(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminService.getAllBookings(this.showOnlyActive()).subscribe({
      next: (res:any) => {
        // Időpont szerinti rendezés (legfrissebb elöl)
        const data = Array.isArray(res) ? res : (res.data || []);

        const sortedData = [...data].sort((a, b) => {
          const dateA = a.timeSlot ? new Date(`${a.timeSlot.date}T${a.timeSlot.startTime}`).getTime() : 0;
          const dateB = b.timeSlot ? new Date(`${b.timeSlot.date}T${b.timeSlot.startTime}`).getTime() : 0;
          return dateA - dateB;
        });

        const processedData = sortedData.map(booking => ({
          ...booking,
          isDelegated: booking.patientId !== booking.createdBy?.id && !!booking.createdBy
        }));

        this.bookings.set(processedData);
        this.isLoading.set(false);
      },
      error: (err:any) => {
        this.isLoading.set(false);
        Swal.fire(
          this.translate.instant('COMMON.ERROR.TITLE'),
          this.translate.instant('COMMON.LOADING_ERROR'),
          'error'
        );
      }
    });
  }
  toggleFilter(): void {
    this.showOnlyActive.update(val => !val);
    this.loadBookings();
  }
  //Foglalás törlése adminisztrátori felülbírálással
  onCancelBooking(bookingId: number): void {
    Swal.fire({
      title: this.translate.instant('BOOKINGS.MESSAGES.CANCEL_CONFIRM_TITLE'),
      text: this.translate.instant('BOOKINGS.MESSAGES.CANCEL_CONFIRM_TEXT'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('BOOKINGS.ACTIONS.CONFIRM_CANCEL'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#d33',
      cancelButtonColor: '#001f3f',
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.deleteBooking(bookingId).subscribe({
          next: () => {
            this.bookings.update(current => current.filter(b => b.id !== bookingId));

            const Toast = Swal.mixin({
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true
            });

            Toast.fire({
              icon: 'success',
              title: this.translate.instant('BOOKINGS.MESSAGES.CANCEL_SUCCESS')
            });
          },
          error: (err) => {
            Swal.fire(
              this.translate.instant('COMMON.ERROR.TITLE'),
              this.translate.instant(err.error?.message || 'COMMON.GENERIC_ERROR'),
              'error'
            );
          }
        });
      }
    });
  }

  isPast(date: string | undefined, time: string | undefined): boolean {
    if (!date || !time) return false;
    const now = new Date();
    const bookingDate = new Date(`${date}T${time}`);
    return bookingDate < now;
  }
   
  formatDate(date: string, time: string): string {
    return `${date} ${time}`;
  }
}
