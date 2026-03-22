import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { BookingService } from '../shared/booking.service'; 
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-my-booking',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './my-booking.component.html',
  styleUrl: './my-booking.component.css',
})
export class MyBookingComponent implements OnInit {
  bookings: any[] = [];
  loading = true;
  errorMessage = '';

  constructor(private bookingService: BookingService) {}

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
        this.errorMessage = 'Nem sikerült betölteni a foglalásokat. ' + (err.error?.message || '');
      }
    });
}
  cancelBooking(id: number): void {
    if (!id || !confirm('Biztosan lemondja ezt az időpontot?')) return;

    this.loading = true;
    this.bookingService.cancelBooking(id).subscribe({
      next: (res) => {
        if (res.success) {
          // Frissítjük a listát a szűrt változattal
          this.bookings = [...this.bookings.filter(b => b.id != id)];
        }
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Hiba történt a lemondás során.';
        this.loading = false;
      }
    });
  }
}

