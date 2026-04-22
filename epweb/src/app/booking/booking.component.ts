import { Component, DestroyRef, OnInit, inject } from '@angular/core';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Staff } from '../shared/interfaces/staff.interface';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './booking.component.html',
  styleUrl: './booking.component.css'
})
export class BookingComponent implements OnInit {
  private readonly bookingApi = inject(BookingService);
  private readonly staffApi = inject(StaffService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly auth = inject(AuthService);
  public translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  protected staffs: any[] = [];
  protected filteredStaffs: any[] = [];
  protected availableSlots: Slot[] = [];
  protected specialties: string[] = [];
  protected selectedSpecialty: string = '';
  protected isLoading = false;
  protected errorMessage = '';
  protected selectedStaffId: number | null = null;
  protected selectedConsultationId: number | null = null; 
  protected filteredConsultations: Consultation[] = [];
  protected consultations: Consultation[] = [];

  protected readonly today = new Date().toISOString().split('T')[0];
  protected selectedDate: string = this.today;
  protected hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  protected weekDays: Date[] = [];
  protected currentDate = new Date();

  ngOnInit(): void {
    this.generateWeek(this.currentDate);
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.loadInitialData(params); 
    });
  } 

  generateWeek(refDate: Date): void {
    const start = new Date(refDate);
    const day = start.getDay();

    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
   
    this.weekDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      this.weekDays.push(d);
    }
  }

  changeWeek(days: number) {
    this.currentDate.setDate(this.currentDate.getDate() + days);
    this.generateWeek(this.currentDate);
    this.loadSlots();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.generateWeek(this.currentDate);
    this.loadSlots();
  }

  getSlotsForHour(day: Date, hour: string) {
    const targetDateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const targetHour = hour.split(':')[0].padStart(2, '0');
  
    return this.availableSlots.filter(s => {
      if (!s.date || !s.startTime) return false;
      const slotDateStr = s.date.toString().substring(0, 10);
      const slotHour = s.startTime.split(':')[0].padStart(2, '0');
      return slotDateStr === targetDateStr && slotHour === targetHour;
    });
  }

  loadInitialData(params?: any): void {
    this.isLoading = true;
    forkJoin({
      staffs: this.staffApi.getStaff(),
      consultations: this.staffApi.getConsultations()
    }).subscribe({
      next: (res: any) => { 
        const rawStaffs = res.staffs?.data || [];

        this.staffs = rawStaffs.map((s: any) => ({
          ...s,
          id: Number(s.id),
          userId: Number(s.userId),
          name: s.user?.name || 'COMMON.UNKNOWN',
          specialty: s.specialty || ''
        }));

        const rawConsultations = res.consultations?.data || res.consultations || [];
        this.consultations = rawConsultations.map((c: any) => ({
          ...c,
          id: Number(c.id)
        }));

        this.specialties = [...new Set(this.staffs.map(s => s.specialty))].filter(Boolean);

        if (params && (params['staffId'] || params['treatmentId'])) {
          this.syncSelectionFromParams(params);
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error(this.translate.instant('COMMON.LOADING_ERROR'), err);
        this.isLoading = false;
      }
    });
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
    const tId = params['treatmentId'] ? Number(params['treatmentId']) : null;
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
          let nextId: number | null = null;

          if (targetTreatmentId) {
            nextId = targetTreatmentId;
          } else {
            const stillValid = this.filteredConsultations.some(c => Number(c.id) === Number(this.selectedConsultationId));
            if (!stillValid || this.filteredConsultations.length === 1) {
              nextId = Number(this.filteredConsultations[0].id);
            } else {
              nextId = this.selectedConsultationId;
            }
          }
          this.selectedConsultationId = nextId;
           
          this.loadSlots();
        } else {
          this.selectedConsultationId = null;
          this.availableSlots = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(this.translate.instant('SERVICES.MESSAGES.TREATMENTS_LOAD_ERROR'), err);
        this.isLoading = false;
      }
    });
  }

    loadSlots(): void {
    if (!this.selectedStaffId || !this.selectedConsultationId) {
      this.availableSlots = [];
      return;
    }

    this.isLoading = true;
    const start = this.weekDays[0].toLocaleDateString('sv-SE');
    const end = this.weekDays[4].toLocaleDateString('sv-SE');

    this.bookingApi.getAvailableSlots(this.selectedStaffId, start, end, this.selectedConsultationId).subscribe({
      next: (res: any) => {
        const allData = res.data || res || [];
        const now = new Date();
        const minimumLeadTimeHours = 0;
        const limitTime = new Date(now.getTime() + ( minimumLeadTimeHours* 60 * 60 * 1000));
        
        this.availableSlots = allData.filter((slot: any) => {
          const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
          return slotDateTime > limitTime;
        });
 
        this.isLoading = false;

        if (this.availableSlots.length === 0) {
          this.errorMessage = this.translate.instant('BOOKING.NO_SLOTS_TITLE');
        } else {
          this.errorMessage = '';
        } 
      },
      error: (err: any) => {
        this.isLoading = false;
        this.availableSlots = [];
        this.errorMessage = this.translate.instant('COMMON.LOADING_ERROR');
      }
    });
  }

  protected onSpecialtyChange(): void {
    this.filteredStaffs = this.staffs.filter(s => s.specialty === this.selectedSpecialty);
    this.selectedStaffId = null;
    this.filteredConsultations = [];
    this.selectedConsultationId = null;
    this.availableSlots = [];
  }

  protected onStaffChange(): void {
    this.updateFilteredConsultations();
  }

  protected onFilterChange(): void {
    this.loadSlots();
  }

  get dayFormat(): string {
    return this.translate.currentLang === 'hu' ? 'EEEE' : 'EEEE'; 
  }
  get dateFormat(): string {
     return this.translate.currentLang === 'hu' ? 'MMM d.' : 'MMM d';
  }
  get currentLocale(): string {
    return this.translate.currentLang === 'hu' ? 'hu' : 'en';
  }

  onReserve(slot: any): void {
    const dateStr = new Date(slot.date).toLocaleDateString(this.translate.currentLang === 'hu' ? 'hu-HU' : 'en-US');
    const timeStr = slot.startTime.slice(0, 5);

    const confirmMessage = this.translate.instant('BOOKING.CONFIRM_QUESTION', { 
      date: dateStr, 
      time: timeStr 
    });
    
    Swal.fire({
      title: this.translate.instant('BOOKING.CONFIRM_TITLE'),
      text: confirmMessage,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      confirmButtonText: this.translate.instant('BOOKINGS.ACTIONS.CONFIRM_BOOKING'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result) => {
      if (result.isConfirmed) {
        this.executeBooking(slot);
      }
    });
  }

  private executeBooking(slot: any): void {
    const currentLang = this.translate.currentLang || 'hu';
    const userId = this.auth.getUserId();

    if (!this.selectedConsultationId && this.filteredConsultations.length === 1) {
        this.selectedConsultationId = this.filteredConsultations[0].id!;
    }

    if (!userId) {
      Swal.fire({
        title: this.translate.instant('COMMON.ERROR.TITLE'),
        text: this.translate.instant('HOME.SWAL.TEXT'),
        icon: 'warning'
      });
      this.router.navigate(['/login']);
      return;
    }

    const selectedTreatment = this.filteredConsultations.find(c => Number(c.id) === Number(this.selectedConsultationId));

    if (!selectedTreatment) {
      Swal.fire({
        title: this.translate.instant('COMMON.ERROR.TITLE'),
        text: this.translate.instant('COMMON.NOT_FOUND'),
        icon: 'error'
        }); 
      return;
    }

    const bookingData = {
      slotId: Number(slot.id),
      patientId: Number(userId),
      staffId: Number(this.selectedStaffId), 
      consultationId: Number(this.selectedConsultationId),
      duration: Number(selectedTreatment?.duration || 30),
      name: selectedTreatment?.name || 'Consultation',
      price: Number(selectedTreatment?.price || 0),
      startTime: slot.startTime, 
      date: slot.date,
      status: 'pending', 
      isPublic: true,
      lang: currentLang
    };

    this.bookingApi.createBooking(bookingData as any).subscribe({
      next: () => {
        Swal.fire({
          title: this.translate.instant('BOOKING.SUCCESS_MSG'),
          icon: 'success',
          confirmButtonColor: '#003366'
        }).then(() => this.loadSlots());
      },
      error: (err: HttpErrorResponse) => {
        console.error('Booking error detail:', err);
        let serverKey ='';
        if (err.error && typeof err.error === 'object') {
          serverKey = err.error.message || err.error.error || '';
        } 
        if (serverKey === 'BOOKING.CONFLICT') {
          Swal.fire({
            title: this.translate.instant('BOOKING.CONFLICT.TITLE'),
            text: this.translate.instant('BOOKING.CONFLICT.MESSAGE') + ' ' + this.translate.instant('BOOKING.CONFLICT.SUBTEXT'),
            icon: 'warning',
            confirmButtonColor: '#003366',
            cancelButtonColor: '#6c757d',
            confirmButtonText: this.translate.instant('BOOKING.CONFLICT.GO_TO_MY_BOOKINGS'),
            cancelButtonText: this.translate.instant('COMMON.CLOSE')
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/my-bookings']);
            }
          });
        } else {
          const bodyText = serverKey ? this.translate.instant(serverKey) : this.translate.instant('BOOKING.ERROR_MSG');

          Swal.fire({
            title:this.translate.instant('COMMON.ERROR.TITLE'),
            text: bodyText,
            icon: 'error',
            confirmButtonColor: '#003366',
            confirmButtonText: String(this.translate.instant('COMMON.OK'))
          });
        }
      }
    });
  }
} 