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
  private readonly daySlotsPageSize = 5;
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
  protected selectedPatientId: number | null = null;
  protected filteredConsultations: Consultation[] = [];
  protected consultations: Consultation[] = [];
  protected patients: Array<{ id: number; name: string; email: string }> = [];
  protected readonly today = new Date().toISOString().split('T')[0];
  protected currentWeekStart: Date = this.getWeekStart(new Date());
  protected selectedSlot: Slot | null = null;
  protected daySlotStartIndexMap: { [date: string]: number } = {};

  protected get selectedStaff(): any | undefined {
    return this.staffs.find(s => Number(s.id) === Number(this.selectedStaffId));
  }

  protected get isDoctorBooking(): boolean {
    return this.auth.getRoleId() === 1;
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
    const requests: Record<string, any> = {
      staffs: this.staffApi.getStaff(),
      consultations: this.staffApi.getConsultations()
    };

    if (this.isDoctorBooking) {
      requests['patients'] = this.staffApi.getPatients();
    }

    forkJoin(requests).subscribe({
      next: (res: any) => {
        this.staffs = res.staffs.data || res.staffs;
        this.consultations = res.consultations.data || res.consultations;

        if (this.isDoctorBooking) {
          this.patients = res.patients?.data || res.patients || [];
          this.selectedPatientId = this.patients.length > 0 ? Number(this.patients[0].id) : null;
          this.lockDoctorToOwnProfile();
        }

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

  private lockDoctorToOwnProfile(): void {
    const currentUserId = this.auth.getUserId();
    const ownStaff = this.staffs.find((staff) => Number(staff.userId) === Number(currentUserId));

    if (ownStaff) {
      this.selectedStaffId = Number(ownStaff.id);
      return;
    }

    this.selectedStaffId = null;
    this.errorMessage = 'A saját orvosprofil nem található, ezért itt nem tud páciensnek foglalni.';
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
    if (this.isDoctorBooking) {
      this.lockDoctorToOwnProfile();
    }

    this.updateFilteredConsultations();
    this.selectedSlot = null;
    this.daySlotStartIndexMap = {};
    this.loadSlots();
  }

  /** Csak a dátum/hét navigáció – NEM tölt újra adatot */
  protected onDateChange(): void {
    this.selectedSlot = null;
    this.daySlotStartIndexMap = {};
    this.currentWeekStart = this.getWeekStart(this.selectedDate);
  }

  /** Vizsgálat típus váltásakor újra lekéri a slotokat */
  protected onConsultationChange(): void {
    this.selectedSlot = null;
    this.daySlotStartIndexMap = {};
    this.loadSlots();
  }

  protected getWeekDays(): string[] {
    const days: string[] = [];
    const start = new Date(this.currentWeekStart);

    for (let i = 0; i < 7; i += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(this.toDateKey(day));
    }

    return days;
  }

  protected goToPreviousWeek(): void {
    const prev = new Date(this.currentWeekStart);
    prev.setDate(prev.getDate() - 7);
    this.currentWeekStart = prev;
    this.ensureSelectedSlotVisible();
  }

  protected goToNextWeek(): void {
    const next = new Date(this.currentWeekStart);
    next.setDate(next.getDate() + 7);
    this.currentWeekStart = next;
    this.ensureSelectedSlotVisible();
  }

  protected goToCurrentWeek(): void {
    this.currentWeekStart = this.getWeekStart(new Date());
    this.ensureSelectedSlotVisible();
  }

  protected getWeekLabel(): string {
    const weekDays = this.getWeekDays();
    if (!weekDays.length) return '';

    const first = this.formatDateLabelShort(weekDays[0]);
    const last = this.formatDateLabelShort(weekDays[6]);
    return `${first} - ${last}`;
  }

  protected getSlotsForDate(date: string): Slot[] {
    return this.availableSlots
      .filter(slot => slot.date === date)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }

  protected getVisibleSlotsForDate(date: string): Slot[] {
    const allSlots = this.getSlotsForDate(date);
    const start = this.daySlotStartIndexMap[date] || 0;
    return allSlots.slice(start, start + this.daySlotsPageSize);
  }

  protected canScrollDayEarlier(date: string): boolean {
    return (this.daySlotStartIndexMap[date] || 0) > 0;
  }

  protected canScrollDayLater(date: string): boolean {
    const allSlots = this.getSlotsForDate(date);
    const start = this.daySlotStartIndexMap[date] || 0;
    return start + this.daySlotsPageSize < allSlots.length;
  }

  protected scrollDayEarlier(date: string): void {
    const currentStart = this.daySlotStartIndexMap[date] || 0;
    this.daySlotStartIndexMap[date] = Math.max(0, currentStart - this.daySlotsPageSize);
  }

  protected scrollDayLater(date: string): void {
    const allSlots = this.getSlotsForDate(date);
    const currentStart = this.daySlotStartIndexMap[date] || 0;
    const maxStart = Math.max(0, allSlots.length - this.daySlotsPageSize);
    this.daySlotStartIndexMap[date] = Math.min(maxStart, currentStart + this.daySlotsPageSize);
  }

  protected isToday(date: string): boolean {
    return date === this.toDateKey(new Date());
  }

  protected getWeekdayLabel(date: string): string {
    const dateObj = new Date(`${date}T00:00:00`);
    return dateObj.toLocaleDateString('hu-HU', { weekday: 'short' });
  }

  protected getDayMonthLabel(date: string): string {
    const dateObj = new Date(`${date}T00:00:00`);
    return dateObj.toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' });
  }

  protected isSlotSelected(slot: Slot): boolean {
    return !!this.selectedSlot && this.selectedSlot.id === slot.id;
  }

  protected formatTimeOnly(time: string): string {
    if (!time) return '';

    const parsedTime = new Date(time);
    if (!isNaN(parsedTime.getTime())) {
      return parsedTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    }

    return time.substring(0, 5);
  }

  protected formatTimeRange(slot: Slot): string {
    const start = this.formatTimeOnly(slot.startTime || '');
    const end = this.formatTimeOnly(slot.endTime || '');
    return `${start} - ${end}`;
  }

  protected loadSlots(): void {
    if (!this.selectedStaffId || !this.selectedConsultationId) {
      this.availableSlots = [];
      this.selectedSlot = null;
      return;
    }

    this.isLoading = true;
    // Dátum nélkül kérjük le az összes elérhető slotot,
    // hogy a heti nézet minden napján megjelenjenek az időpontok.
    this.bookingApi.getAvailableSlots(
      Number(this.selectedStaffId),
      Number(this.selectedConsultationId)
    ).subscribe({
      next: (res: any) => {
        const allData = res.data || res;
        this.availableSlots = allData
          .filter((slot: Slot) => this.isSelectableDate(slot.date))
          .sort((a: Slot, b: Slot) => {
            const dateCompare = (a.date || '').localeCompare(b.date || '');
            if (dateCompare !== 0) return dateCompare;
            return (a.startTime || '').localeCompare(b.startTime || '');
          });

        const hasSelected = this.selectedSlot
          ? this.availableSlots.some(s => s.id === this.selectedSlot?.id)
          : false;
        if (!hasSelected) {
          this.selectedSlot = null;
        }

        if (this.selectedDate) {
          this.currentWeekStart = this.getWeekStart(this.selectedDate);
        }

        this.isLoading = false;

        this.errorMessage = '';
      },
      error: (err: any) => {
        this.isLoading = false;
        this.availableSlots = [];
        this.selectedSlot = null;
        this.errorMessage = 'Hiba az időpontok lekérésekor.';
      }
    });
  }

  protected onReserve(slot: Slot): void {
    if (this.isDoctorBooking && !this.selectedPatientId) {
      Swal.fire('Hiányzó páciens', 'Előbb válasszon ki egy regisztrált pácienst.', 'warning');
      return;
    }

    this.selectedSlot = slot;
    this.ensureSlotVisibleInDayPage(slot);

    Swal.fire({
      title: 'Foglalás megerősítése',
      text: `Időpont: ${slot.date} ${this.formatTimeOnly(slot.startTime)}`,
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

  private isSelectableDate(date: string): boolean {
    const dateObj = new Date(`${date}T00:00:00`);
    return !isNaN(dateObj.getTime());
  }

  private getWeekStart(dateValue: Date | string): Date {
    const date = new Date(dateValue);
    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateLabelShort(date: string): string {
    const dateObj = new Date(`${date}T00:00:00`);
    return dateObj.toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' });
  }

  private ensureSelectedSlotVisible(): void {
    if (!this.selectedSlot) return;

    const visibleDays = this.getWeekDays();
    if (!visibleDays.includes(this.selectedSlot.date)) {
      this.selectedSlot = null;
      return;
    }

    this.ensureSlotVisibleInDayPage(this.selectedSlot);
  }

  private ensureSlotVisibleInDayPage(slot: Slot): void {
    const allSlots = this.getSlotsForDate(slot.date);
    const slotIndex = allSlots.findIndex(item => item.id === slot.id);
    if (slotIndex < 0) return;

    const start = Math.floor(slotIndex / this.daySlotsPageSize) * this.daySlotsPageSize;
    this.daySlotStartIndexMap[slot.date] = start;
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
      patientId: this.isDoctorBooking ? Number(this.selectedPatientId) : Number(userId),
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

    if (this.isDoctorBooking && !bookingData.patientId) {
      Swal.fire('Hiányzó páciens', 'Foglalás előtt válasszon ki egy pácienst.', 'warning');
      return;
    }

    console.log('Foglalási adatok küldése:', bookingData);

    this.bookingApi.createBooking(bookingData as any).subscribe({
      next: (res: any) => {
        Swal.fire({
          title: 'Sikeres foglalás!',
          text: this.isDoctorBooking
            ? 'Az időpontot a kiválasztott pácienshez rögzítettük.'
            : 'Időpontod rögzítettük. Hamarosan kapsz egy e-mailt.',
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