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
  protected selectedDate: string = this.getInitialBookingDate();
  protected selectedConsultationId: number | null = null; 
  protected filteredConsultations: Consultation[] = [];
  protected consultations: Consultation[] = [];
  protected readonly today = new Date().toISOString().split('T')[0];

  protected get selectedStaff(): any | undefined {
    return this.staffs.find(s => Number(s.id) === Number(this.selectedStaffId));
  }

  protected get selectedStaffName(): string {
    const staff = this.selectedStaff;
    if (!staff) return '';
    return staff.name || staff.user?.name || 'Ismeretlen szakember';
  }

  protected getStaffLabel(staff: any): string {
    const staffName = staff?.name || staff?.user?.name || 'Névtelen szakember';
    const specialty = staff?.specialty || 'Szakember';
    return `${staffName} - ${specialty}`;
  }

  private getInitialBookingDate(): string {
    const now = new Date();
    if (now.getDay() === 0) {
      now.setDate(now.getDate() + 1);
    }
    return now.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    // Query paraméterek figyelése
    this.route.queryParams.subscribe(params => {
      if (params['staffId']) {
        this.selectedStaffId = Number(params['staffId']);
      }
    });
    this.loadInitialData();
  }

  /**
   * Kezdeti adatok betöltése
   */
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

  /**
   * Szolgáltatások szűrése az orvos alapján
   */
  protected updateFilteredConsultations(): void {
    const selectedStaff = this.selectedStaff;
    
    if (selectedStaff && selectedStaff.treatments && selectedStaff.treatments.length > 0) {
      const allowedIds = selectedStaff.treatments.map((t: any) => Number(t.id));
      this.filteredConsultations = this.consultations.filter(c => 
        allowedIds.includes(Number(c.id))
      );
    } else {
      this.filteredConsultations = [];
    }

    const isStillAvailable = this.filteredConsultations.some(
      c => Number(c.id) === Number(this.selectedConsultationId)
    );

    if (!isStillAvailable && this.filteredConsultations.length > 0) {
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

  private getSlotHour(slot: Slot): number {
    return Number(slot.startTime.split(':')[0]);
  }

  protected get morningSlots(): Slot[] {
    return this.availableSlots.filter(slot => {
      const hour = this.getSlotHour(slot);
      return hour >= 8 && hour < 12;
    });
  }

  protected get afternoonSlots(): Slot[] {
    return this.availableSlots.filter(slot => {
      const hour = this.getSlotHour(slot);
      return hour >= 12 && hour < 17;
    });
  }

  protected get eveningSlots(): Slot[] {
    return this.availableSlots.filter(slot => {
      const hour = this.getSlotHour(slot);
      return hour >= 17;
    });
  }

  protected formatSlotDate(date: string): string {
    return date.replace(/-/g, '.');
  }

  /**
   * Szabad időpontok lekérése
   */
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
        this.availableSlots = allData.filter((slot: Slot) => slot.date === this.selectedDate);
        this.isLoading = false;
        this.errorMessage = '';
      },
      error: (err: any) => {
        this.isLoading = false;
        this.availableSlots = [];
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
      confirmButtonColor: '#003366',
      confirmButtonText: 'Igen, lefoglalom',
      cancelButtonText: 'Mégse'
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeBooking(slot);
      }
    });
  }

  /**
   * A tényleges foglalás végrehajtása - Összehangolva a Backend Service-szel
   */
  private executeBooking(slot: Slot): void {
    const userId = this.auth.getUserId();

    if (!userId) {
      Swal.fire('Hiba', 'A foglaláshoz be kell jelentkezned!', 'warning');
      this.router.navigate(['/login']);
      return;
    }

    // Megkeressük a kiválasztott szolgáltatást az adatok kinyeréséhez
    const selectedType = this.consultations.find(c => Number(c.id) === Number(this.selectedConsultationId));

    // Az objektum felépítése a Backend igényei szerint
    const bookingData = {
      slotId: Number(slot.id),
      patientId: Number(userId),
      staffId: Number(slot.staffId || this.selectedStaffId), 
      consultationId: Number(this.selectedConsultationId),
      
      // Itt küldjük a hiányolt duration-t és az árat
      duration: Number(selectedType?.duration || 30),
      name: selectedType?.name || 'Konzultáció',
      price: Number(selectedType?.price || 0),
      
      // Segédadatok a backendnek/emailnek
      startTime: slot.startTime, 
      date: slot.date
    };

    console.log('Foglalási adatok küldése:', bookingData);

    this.bookingApi.createBooking(bookingData as any).subscribe({
      next: (res: any) => {
        Swal.fire({
          title: 'Sikeres foglalás!',
          text: 'Időpontod rögzítettük. Hamarosan kapsz egy e-mailt.',
          icon: 'success',
          confirmButtonColor: '#003366'
        }).then(() => {
          this.loadSlots(); // Frissítés, hogy a lefoglalt eltűnjön
        });
      },
      error: (err) => {
        console.error('Szerver hiba válasz:', err.error);
        // Próbáljuk kinyerni a legpontosabb hibaüzenetet a backendtől
        const msg = err.error?.error || err.error?.message || 'A foglalás nem sikerült.';
        Swal.fire('Hiba', msg, 'error');
      }
    });
  }
}