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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
})
export class BookingComponent implements OnInit {
  private readonly daySlotsPageSize = 5;
  private readonly bookingApi = inject(BookingService);
  private readonly staffApi = inject(StaffService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  public readonly auth = inject(AuthService);

  protected staffs: any[] = [];
  protected filteredStaffs: any[] = [];
  protected availableSlots: Slot[] = [];

  protected specialties: string[] = [];
  protected selectedSpecialty: string = '';

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
  protected daySlotStartIndexMap: Record<string, number> = {};

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.loadInitialData(params); 
    });
  } 

  protected get selectedStaff(): any | undefined {
    return this.staffs.find(s => Number(s.id) === Number(this.selectedStaffId));
  }

  protected get isDoctorBooking(): boolean {
    return this.auth.getRoleId() === 1;
  }

  protected get isStaffAssistedBooking(): boolean {
    return this.auth.getRoleId() >= 1;
  }

  protected get selectedStaffName(): string {
    const staff = this.selectedStaff;
    return staff?.user?.name || staff?.name || '';
  }

  private getInitialBookingDate(): string {
    const now = new Date();
    const day = now.getDay();
    if (day === 6) {
      now.setDate(now.getDate() + 2);
    } else if (day === 0) {
      now.setDate(now.getDate() + 1);
    }
    return now.toISOString().split('T')[0];
  }

  loadInitialData(params?: any): void {
    this.isLoading = true;
    const requests: Record<string, any> = {
      staffs: this.staffApi.getStaff(),
      consultations: this.staffApi.getConsultations()
    };

    if (this.isStaffAssistedBooking) {
      requests['patients'] = this.staffApi.getPatients();
    }

    forkJoin(requests).subscribe({
      next: (res: any) => { 
        const rawStaffs = res.staffs?.data || res.staffs || [];
        this.staffs = rawStaffs.map((s: any) => ({
          ...s,
          id: Number(s.id),
          userId: Number(s.userId)
        }));

        const rawConsultations = res.consultations?.data || res.consultations || [];
        this.consultations = rawConsultations.map((c: any) => ({
          ...c,
          id: Number(c.id)
        }));

        if (this.isStaffAssistedBooking) {
          this.patients = (res.patients?.data || res.patients || []).map((patient: any) => ({
            id: Number(patient.id),
            name: patient.name,
            email: patient.email
          }));
          this.selectedPatientId = null;
        }

        if (this.isDoctorBooking) {
          this.lockDoctorToOwnProfile();
        }

        this.specialties = [...new Set(this.staffs.map(s => s.specialty))].filter(Boolean);

        if (params && (params['staffId'] || params['treatmentId'] || params['consultationId'])) {
          this.syncSelectionFromParams(params);
        } else if (this.isDoctorBooking && this.selectedStaffId) {
          this.updateFilteredConsultations();
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error(this.translate.instant('COMMON.LOAD_ERROR'), err);
        this.isLoading = false;
      }
    });
  }

  private lockDoctorToOwnProfile(): void {
    const currentUserId = this.auth.getUserId();
    const ownStaff = this.staffs.find((staff) => Number(staff.userId) === Number(currentUserId));

    if (ownStaff) {
      this.selectedStaffId = Number(ownStaff.id);
      if (ownStaff.specialty) {
        this.selectedSpecialty = ownStaff.specialty;
        this.filteredStaffs = this.staffs.filter((staff) => staff.specialty === ownStaff.specialty);
      }
      return;
    }

    this.selectedStaffId = null;
    this.errorMessage = this.translate.instant('BOOKING.OWN_PROFILE_NOT_FOUND');
  }

  private syncSelectionFromParams(params: any): void {
    if (params['staffId']) {
      this.selectedStaffId = Number(params['staffId']);
      
      const doctor = this.staffs.find(s => Number(s.id) === this.selectedStaffId);
      if (doctor) {
        this.selectedSpecialty = doctor.specialty;
        this.filteredStaffs = this.staffs.filter(s => s.specialty === this.selectedSpecialty);
      }
    }
    // Meghívjuk a szűrést, átadva a treatmentId-t ha van
    const tId = params['treatmentId']
      ? Number(params['treatmentId'])
      : (params['consultationId'] ? Number(params['consultationId']) : null);

    if (params['staffId']) {
      this.selectedDate = this.getInitialBookingDate();
      this.currentWeekStart = this.getWeekStart(this.selectedDate);
    }

    this.updateFilteredConsultations(tId);
  }

  protected updateFilteredConsultations(targetTreatmentId?: number | null): void {
    if (!this.selectedStaffId) {
      this.filteredConsultations = [];
      this.selectedConsultationId = null;
      return;
    }
    this.isLoading = true;
    this.staffApi.getTreatmentsForStaff(Number(this.selectedStaffId)).subscribe({
      next: (res: any) => {
        this.filteredConsultations = res.data || res || [];
        
        if (this.filteredConsultations.length > 0) {
          if (targetTreatmentId) {
            this.selectedConsultationId = targetTreatmentId;
          } else {
            const stillValid = this.filteredConsultations.some(c => Number(c.id) === Number(this.selectedConsultationId));
            if (!stillValid) {
              this.selectedConsultationId = Number(this.filteredConsultations[0].id);
            }
          }
          this.loadSlots();
        } else {
          this.selectedConsultationId = null;
          this.availableSlots = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(this.translate.instant('BOOKING.TREATMENTS_LOAD_ERROR'), err);
        this.isLoading = false;
      }
    });
  }

  protected onSpecialtyChange(): void {
    if (this.isDoctorBooking) {
      this.lockDoctorToOwnProfile();
      this.updateFilteredConsultations();
      return;
    }

    this.filteredStaffs = this.staffs.filter(s => s.specialty === this.selectedSpecialty);
    this.selectedStaffId = null;
    this.filteredConsultations = [];
    this.selectedConsultationId = null;
    this.availableSlots = [];
    this.selectedSlot = null;
    this.daySlotStartIndexMap = {};
  }

  protected onStaffChange(): void {
    if (this.isDoctorBooking) {
      this.lockDoctorToOwnProfile();
    }

    this.selectedSlot = null;
    this.daySlotStartIndexMap = {};
    this.updateFilteredConsultations();
  }

  protected onDateChange(): void {
    this.selectedSlot = null;
    this.daySlotStartIndexMap = {};
    this.currentWeekStart = this.getWeekStart(this.selectedDate);
  }

  protected onConsultationChange(): void {
    this.selectedSlot = null;
    this.daySlotStartIndexMap = {};
    this.loadSlots();
  }

  protected getWeekDays(): string[] {
    const days: string[] = [];
    const start = new Date(this.currentWeekStart);

    for (let index = 0; index < 7; index += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      days.push(this.toDateKey(day));
    }

    return days;
  }

  protected getWeekLabel(): string {
    const weekDays = this.getWeekDays();
    if (!weekDays.length) return '';
    return `${this.formatDateLabelShort(weekDays[0])} - ${this.formatDateLabelShort(weekDays[6])}`;
  }

  protected goToPreviousWeek(): void {
    const previous = new Date(this.currentWeekStart);
    previous.setDate(previous.getDate() - 7);
    this.currentWeekStart = previous;
    this.ensureSelectedSlotVisible();
  }

  protected goToNextWeek(): void {
    const next = new Date(this.currentWeekStart);
    next.setDate(next.getDate() + 7);
    this.currentWeekStart = next;
    this.ensureSelectedSlotVisible();
  }

  protected goToCurrentWeek(): void {
    this.selectedDate = this.getInitialBookingDate();
    this.currentWeekStart = this.getWeekStart(this.selectedDate);
    this.ensureSelectedSlotVisible();
  }

  protected getSlotsForDate(date: string): Slot[] {
    return this.availableSlots
      .filter(slot => slot.date === date)
      .sort((left, right) => (left.startTime || '').localeCompare(right.startTime || ''));
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
    return new Date(`${date}T00:00:00`).toLocaleDateString(this.getCurrentLocale(), { weekday: 'short' });
  }

  protected getDayMonthLabel(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString(this.getCurrentLocale(), { month: '2-digit', day: '2-digit' });
  }

  protected isSlotSelected(slot: Slot): boolean {
    return !!this.selectedSlot && this.selectedSlot.id === slot.id;
  }

  protected formatTimeRange(slot: Slot): string {
    return `${this.formatTimeOnly(slot.startTime)} - ${this.formatTimeOnly(slot.endTime)}`;
  }

  protected formatTimeOnly(time: string): string {
    return String(time || '').slice(0, 5);
  }

  protected translateSpecialty(specialty: string | null | undefined): string {
    if (!specialty) {
      return '';
    }

    const key = this.toTranslationKey(specialty);
    const translated = this.translate.instant(`SPECIALTY_NAMES.${key}`);
    return translated !== `SPECIALTY_NAMES.${key}` ? translated : specialty;
  }

  protected translateServiceName(serviceName: string | null | undefined): string {
    if (!serviceName) {
      return this.translate.instant('DOCTOR_CALENDAR.CONSULTATION_FALLBACK');
    }

    const key = this.toTranslationKey(serviceName);
    const translated = this.translate.instant(`SERVICE_NAMES.${key}`);
    return translated !== `SERVICE_NAMES.${key}` ? translated : serviceName;
  }

  loadSlots(): void {
    if (!this.selectedStaffId || !this.selectedConsultationId) {
      this.availableSlots = [];
      this.selectedSlot = null;
      return;
    }

    this.isLoading = true;
    this.bookingApi.getAvailableSlots(
      Number(this.selectedStaffId), 
      Number(this.selectedConsultationId)
    ).subscribe({
      next: (res: any) => {
        const allData = res.data || res;
        const now = new Date();
        this.availableSlots = allData
          .filter((slot: Slot) => this.isSelectableSlot(slot, now))
          .sort((left: Slot, right: Slot) => {
            const dateCompare = (left.date || '').localeCompare(right.date || '');
            if (dateCompare !== 0) return dateCompare;
            return (left.startTime || '').localeCompare(right.startTime || '');
          });

        if (this.selectedDate) {
          this.currentWeekStart = this.getWeekStart(this.selectedDate);
        }

        if (this.selectedSlot && !this.availableSlots.some(slot => slot.id === this.selectedSlot?.id)) {
          this.selectedSlot = null;
        }

        this.errorMessage = '';
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.availableSlots = [];
        this.selectedSlot = null;
        this.errorMessage = this.translate.instant('BOOKING.SLOTS_LOAD_ERROR');
      }
    });
  }

  protected onReserve(slot: Slot): void {
    if (this.isStaffAssistedBooking && !this.selectedPatientId) {
      Swal.fire(this.translate.instant('BOOKING.MISSING_PATIENT_TITLE'), this.translate.instant('BOOKING.MISSING_PATIENT_TEXT'), 'warning');
      return;
    }

    this.selectedSlot = slot;
    this.ensureSlotVisibleInDayPage(slot);

    Swal.fire({
      title: this.translate.instant('BOOKING.CONFIRM_TITLE'),
      text: this.translate.instant('BOOKING.CONFIRM_TEXT', { date: slot.date, time: this.formatTimeOnly(slot.startTime) }),
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      confirmButtonText: this.translate.instant('BOOKING.CONFIRM_OK'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeBooking(slot);
      }
    });
  }

  private isSelectableSlot(slot: Slot, reference: Date): boolean {
    const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
    return !isNaN(slotDateTime.getTime()) && slotDateTime > reference;
  }

  private toTranslationKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
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
    return new Date(`${date}T00:00:00`).toLocaleDateString(this.getCurrentLocale(), { month: '2-digit', day: '2-digit' });
  }

  private getCurrentLocale(): string {
    return this.translate.currentLang === 'en' ? 'en-US' : 'hu-HU';
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
    this.daySlotStartIndexMap[slot.date] = Math.floor(slotIndex / this.daySlotsPageSize) * this.daySlotsPageSize;
  }

  private resolveBookingErrorMessage(err: any): string {
    const errorCode = err?.error?.errorCode;
    if (errorCode) {
      const translated = this.translate.instant(`BOOKING.ERRORS.${errorCode}`);
      if (translated !== `BOOKING.ERRORS.${errorCode}`) {
        return translated;
      }
    }

    return err?.error?.message || err?.error?.error || this.translate.instant('BOOKING.ERROR_MSG');
  }

  private executeBooking(slot: Slot): void {
    const userId = this.auth.getUserId();

    if (!userId) {
      Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('BOOKING.LOGIN_REQUIRED'), 'warning');
      this.router.navigate(['/login']);
      return;
    }

    const selectedTreatment = this.filteredConsultations.find(c => Number(c.id) === Number(this.selectedConsultationId));

    if (!selectedTreatment) {
      Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('BOOKING.TREATMENT_NOT_AVAILABLE'), 'error');
      return;
    }

    const bookingData = {
      slotId: Number(slot.id),
      patientId: this.isStaffAssistedBooking ? Number(this.selectedPatientId) : Number(userId),
      staffId: Number(slot.staffId || this.selectedStaffId), 
      consultationId: Number(this.selectedConsultationId),
      duration: Number(selectedTreatment?.duration || 30),
      name: selectedTreatment?.name || 'Konzultáció',
      price: Number(selectedTreatment?.price || 0),
      startTime: slot.startTime, 
      date: slot.date,
      isPublic: true
    };

    if (this.isStaffAssistedBooking && !bookingData.patientId) {
      Swal.fire(this.translate.instant('BOOKING.MISSING_PATIENT_TITLE'), this.translate.instant('BOOKING.SELECT_PATIENT_BEFORE_BOOKING'), 'warning');
      return;
    }

    this.bookingApi.createBooking(bookingData as any).subscribe({
      next: () => {
        Swal.fire(
          this.translate.instant('BOOKING.SUCCESS_TITLE'),
          this.isStaffAssistedBooking
            ? this.translate.instant('BOOKING.SUCCESS_DOCTOR')
            : this.translate.instant('BOOKING.SUCCESS_PATIENT'),
          'success'
        )
          .then(() => this.loadSlots());
      },
      error: (err) => {
        const msg = this.resolveBookingErrorMessage(err);
        Swal.fire(this.translate.instant('COMMON.ERROR'), msg, 'error');
      }
    });
  }
}