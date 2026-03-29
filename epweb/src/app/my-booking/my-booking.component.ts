import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { BookingService } from '../shared/booking.service'; 
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../shared/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-my-booking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-booking.component.html',
  styleUrl: './my-booking.component.css',
})
export class MyBookingComponent implements OnInit {
  protected bookings: any[] = [];
  protected loading = true;
  protected errorMessage = '';

  private readonly bookingService = inject(BookingService);
  public readonly auth = inject (AuthService);
  
  ngOnInit(): void {
    this.loadMyBookings();
  }

  loadMyBookings(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;

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
        this.errorMessage = 'Nem sikerült betölteni a foglalásokat. ' + (err.error?.message || '');
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

    const appointmentDate = new Date(`${slot.date}T${slot.startTime}`);

    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

    return (appointmentDate.getTime() - Date.now()) >= twentyFourHoursInMs;
}

  cancelBooking(id: number): void {
    if (!id) return;

    Swal.fire({
    title: 'Biztosan lemondod?',
    text: "Ezt a műveletet nem lehet visszavonni!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Igen, lemondom!',
    cancelButtonText: 'Mégse'
  }).then((result) => {
    if (result.isConfirmed) {
      this.loading = true;
      
      this.bookingService.cancelBooking(id).subscribe({
        next: (res) => {
          if (res.success) {
            // UI frissítése: kivesszük a listából a törölt elemet
            this.bookings = this.bookings.filter(b => b.id !== id);
            
            Swal.fire('Sikeres lemondás!', res.message || 'Az időpontod felszabadult.', 'success');
          }
          this.loading = false;
        },
        error: (err) => {
          this.loading = false; 
          // Elérjük a backendről jövő üzenetet ("24 órán belül nem mondható le")
          const errorMsg = err.error?.message || 'Hiba történt a lemondás során.';
          
          Swal.fire('Hiba', errorMsg, 'error');
          this.errorMessage = errorMsg; 
        }
      });
    }
  });
}
}