import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../shared/booking.service';
import { StaffService } from '../shared/staff.service';
import { AuthService } from '../shared/auth.service';
import { Slot } from '../shared/interfaces/slot.interface';
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
  protected selectedConsultationId: number | null = null; 
  protected filteredConsultations: Consultation[] = [];
  protected consultations: Consultation[] = [];
  protected readonly today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.loadInitialData();

    this.route.queryParams.subscribe(params => {
      let hasChange = false;

      if (params['staffId']) {
        this.selectedStaffId = Number(params['staffId']);
        hasChange = true;
      }
      
      if (params['treatmentId']) {
        this.selectedConsultationId = Number(params['treatmentId']);
        hasChange = true;
      }

      if (hasChange && this.staffs.length > 0) {
        this.onStaffChange();
      }
    });
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

        const urlStaffId = this.route.snapshot.queryParams['staffId'];
        const urlTreatmentId = this.route.snapshot.queryParams['treatmentId'];

        if (urlStaffId) {
          this.selectedStaffId = Number(urlStaffId);
        } else if (this.staffs.length > 0 && !this.selectedStaffId) {
          this.selectedStaffId = Number(this.staffs[0].userId || this.staffs[0].id);
        }

        if (urlTreatmentId) {
          this.selectedConsultationId = Number(urlTreatmentId);
        }

        this.updateFilteredConsultations();
        this.isLoading = false;
        this.loadSlots();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Hiba az adatok betöltésekor.';
        console.error(err);
      }
    });
  }

  protected updateFilteredConsultations(): void {
    if (!this.selectedStaffId) return;

    const selectedStaff = this.staffs.find(s => 
      Number(s.userId) === Number(this.selectedStaffId) || 
      Number(s.id) === Number(this.selectedStaffId)
    );
    
    if (selectedStaff && selectedStaff.treatments) {
      const allowedIds = selectedStaff.treatments.map((t: any) => Number(t.id));
      this.filteredConsultations = this.consultations.filter(c => 
        allowedIds.includes(Number(c.id))
      );
    } else {
      this.filteredConsultations = [];
    }

    const isValid = this.filteredConsultations.some(
      c => Number(c.id) === Number(this.selectedConsultationId)
    );

    if (!isValid && this.filteredConsultations.length > 0) {
      this.selectedConsultationId = Number(this.filteredConsultations[0].id);
    } else if (this.filteredConsultations.length === 0) {
      this.selectedConsultationId = null;
    }
  }

  protected onStaffChange(): void {
    this.updateFilteredConsultations();
    this.loadSlots();
  }

  protected onFilterChange(): void {
    this.loadSlots();
  }

  loadSlots(): void {
    if (!this.selectedStaffId || !this.selectedConsultationId) {
      this.availableSlots = [];
      return;
    }

    this.isLoading = true;
    this.bookingApi.getAvailableSlots(
      Number(this.selectedStaffId), 
      Number(this.selectedConsultationId), 
      this.selectedDate
    ).subscribe({
      next: (res: any) => {
        const allData = res.data || res;
        this.availableSlots = allData.filter((slot: any) => slot.date === this.selectedDate);
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.availableSlots = [];
        this.errorMessage = 'Hiba az időpontok lekérésekor.';
      }
    });
  }

  onReserve(slot: any): void {
    Swal.fire({
      title: 'Foglalás megerősítése',
      text: `Időpont: ${slot.date} ${slot.startTime.slice(0, 5)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      confirmButtonText: 'Igen, lefoglalom',
      cancelButtonText: 'Mégse'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeBooking(slot);
      }
    });
  }

  private executeBooking(slot: any): void {
    const userId = this.auth.getUserId();

    if (!userId) {
      Swal.fire('Hiba', 'A foglaláshoz be kell jelentkezned!', 'warning');
      this.router.navigate(['/login']);
      return;
    }

    const selectedTreatment = this.consultations.find(c => Number(c.id) === Number(this.selectedConsultationId));

    if (!selectedTreatment) {
    Swal.fire('Hiba', 'A kiválasztott vizsgálat nem érhető el ennél az orvosnál!', 'error');
    return;
    }

    const bookingData = {
      slotId: Number(slot.id),
      patientId: Number(userId),
      staffId: Number(this.selectedStaffId), 
      consultationId: Number(this.selectedConsultationId),
      duration: Number(selectedTreatment?.duration || 30),
      name: selectedTreatment?.name || 'Konzultáció',
      price: Number(selectedTreatment?.price || 0),
      startTime: slot.startTime, 
      date: slot.date,
      status: 'pending', 
      isPublic: true
    };

    this.bookingApi.createBooking(bookingData as any).subscribe({
      next: () => {
        Swal.fire('Sikeres foglalás!', 'Az időpontot rögzítettük.', 'success')
          .then(() => this.loadSlots());
      },
      error: (err) => {
        const msg = err.error?.message || 'A foglalás nem sikerült.';
        Swal.fire('Hiba', msg, 'error');
      }
    });
  }
}