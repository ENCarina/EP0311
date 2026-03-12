import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../shared/booking.service';
import { StaffService } from '../shared/staff.service';
import { AuthService } from '../shared/auth.service';
import { Slot } from '../shared/interfaces/slot.interface';
import { Booking } from '../shared/interfaces/booking.interface';
import { Consultation } from '../shared/interfaces/consultation.interface';
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
})
export class BookingComponent implements OnInit {
  private readonly bookingApi = inject(BookingService);
  private readonly staffApi = inject(StaffService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly auth = inject(AuthService);

  protected staffs: any[] = [];
  protected availableSlots: Slot[] = [];
  protected isLoading = false;
  protected errorMessage = '';

  protected selectedStaffId: number | null = null;
  protected selectedDate: string = new Date().toISOString().split('T')[0];
  protected selectedConsultationId: number = 1; 
  protected consultations: Consultation[] = [];
  protected readonly today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
    if (params['staffId']) {
      this.selectedStaffId = Number(params['staffId']);
      console.log('Kiválasztott orvos ID:', this.selectedStaffId);
    }
  });
    this.loadInitialData();
  }
  
   protected onFilterChange(): void {
    if (this.selectedStaffId && this.selectedConsultationId) {
      this.loadSlots();
  }
}
  loadInitialData(): void {
    this.isLoading = true;
    forkJoin({
      staffs: this.staffApi.getStaff(),
      consultations: this.staffApi.getConsultations()
    }).subscribe({
      next: (res: any) => {
        this.staffs = res.staffs.data || res.staffs;
        this.consultations = res.consultations.data || res.consultations;

        if (!this.selectedStaffId && this.staffs.length > 0) {
        this.selectedStaffId = this.staffs[0].id;
      }
        
        if (this.consultations.length > 0) {
          this.selectedConsultationId = Number(this.consultations[0].id);
        }
        this.isLoading = false;
        this.loadSlots();
      },
    error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Hiba az adatok betöltésekor.';
      }
    });
  }

  loadSlots(): void {
    if (!this.selectedStaffId) return;

    this.isLoading = true;
    this.bookingApi.getAvailableSlots(
      Number(this.selectedStaffId), 
      Number(this.selectedConsultationId), 
      this.selectedDate
    ).subscribe({
      next: (res: any) => {
        this.availableSlots = res.data || res ;
        this.isLoading = false;
        this.errorMessage = '';
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Hiba az időpontok lekérésekor.';
      }
    });
  }

  onReserve(slot: Slot): void {
    Swal.fire({
      title: 'Foglalás megerősítése',
      text: `Időpont: ${slot.date} ${slot.startTime.slice(0, 5)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Igen, lefoglalom',
      cancelButtonText: 'Mégse'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeBooking(slot);
      }
    });
  }
  private executeBooking(slot: Slot): void {
    const userId = this.auth.getUserId();

    // 1. Alapvető ellenőrzések
    if (!userId) {
        Swal.fire('Hiba', 'A foglaláshoz be kell jelentkezned!', 'warning');
        this.router.navigate(['/login']);
        return;
    }
    const selectedType = this.consultations.find(c => Number(c.id) === Number(this.selectedConsultationId));

    const bookingData = {
        slotId: Number(slot.id),
        patientId: Number(userId),
        staffId: Number(slot.staffId), 
        consultationId: Number(this.selectedConsultationId),
        name: selectedType?.name || 'Konzultáció',
        price: selectedType?.price || 0,
        startTime: slot.startTime, 
        date: slot.date,
        status: 'Confirmed',
        isPublic: false 
    };
    this.bookingApi.createBooking(bookingData as any).subscribe({
        next: () => {
            Swal.fire('Sikeres foglalás!','Időpontod rögzítettük.', 'success')
            this.loadSlots(); 
        },
        error: (err) => {
      const msg = err.error?.message || 'A foglalás nem sikerült.';
      Swal.fire('Hiba', msg, 'error');
    }
  });
}
}