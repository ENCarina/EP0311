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
import { leadingComment } from '@angular/compiler';

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
  private readonly translate = inject(TranslateService);

  protected staffs: any[] = [];
  protected filteredStaffs: any[] = [];
  protected availableSlots: Slot[] = [];
  protected specialties: string[] = [];
  protected selectedSpecialty: string = '';
  protected isLoading = false;
  protected errorMessage = '';
  protected selectedStaffId: number | null = null;
  protected selectedDate: string = new Date().toISOString().split('T')[0];
  protected selectedConsultationId: number | null = null; 
  protected filteredConsultations: Consultation[] = [];
  protected consultations: Consultation[] = [];
  protected readonly today = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.loadInitialData(params); 
    });
  } 
  loadInitialData(params?: any): void {
    this.isLoading = true;
    forkJoin({
      staffs: this.staffApi.getStaff(),
      consultations: this.staffApi.getConsultations()
    }).subscribe({
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
        console.error(this.translate.instant('SERVICES.MESSAGES.TREATMENTS_LOAD_ERROR'), err);
        this.isLoading = false;
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
        const now = new Date();

        const minimumLeadTimeHours = 3;
        const limitTime = new Date(now.getTime() + (minimumLeadTimeHours * 60 * 60 * 1000));
        
        let filtered = allData.filter((slot: any) => {
          if (slot.date !== this.selectedDate) return false;
          const slotDateTime = new Date(`${slot.date}T${slot.startTime}`);
          // A SZABÁLY ALKALMAZÁSA:
          return slotDateTime > limitTime;
          });

        this.availableSlots = filtered;
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

  onReserve(slot: any): void {
    Swal.fire({
      title: this.translate.instant('CONFIRM_PROMPT'),
      text: `${this.translate.instant('BOOKING.SELECT_DATE')}: ${slot.date} ${slot.startTime.slice(0, 5)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      confirmButtonText: this.translate.instant('COMMON.SUCCESS'),
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

    if (!userId) {
      Swal.fire(this.translate.instant('COMMON.ERROR'),
      this.translate.instant('HOME.SWAL.TEXT'),
       'warning');
      this.router.navigate(['/login']);
      return;
    }

    const selectedTreatment = this.filteredConsultations.find(c => Number(c.id) === Number(this.selectedConsultationId));

    if (!selectedTreatment) {
      Swal.fire(this.translate.instant('COMMON.ERROR'),this.translate.instant('COMMON.NOT_FOUND'),'error');
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
        Swal.fire(this.translate.instant('BOOKING.SUCCESS_MSG'), '', 'success')
          .then(() => this.loadSlots());
      },
      error: (err) => {
        const msg = err.error?.message || this.translate.instant('BOOKING.ERROR_MSG');
        Swal.fire(this.translate.instant('COMMON.ERROR'), msg, 'error');
      }
    });
  }
}