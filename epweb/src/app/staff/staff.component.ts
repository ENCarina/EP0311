import { Component, inject, OnInit } from '@angular/core';
import { StaffService } from '../shared/staff.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../shared/auth.service';
import { CommonModule } from '@angular/common';
import { BookingService } from '../shared/booking.service';
import { ConsultationService } from '../shared/consultation.service';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css',
})
export class StaffComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  protected readonly api = inject(StaffService);
  protected readonly consultationService = inject(ConsultationService);
  protected readonly builder = inject(FormBuilder);
  public readonly auth = inject(AuthService);
  private readonly bookingApi = inject(BookingService);

  protected staffs: any[] = [];
  protected allConsultations: any[] = [];
  protected selectedTreatments: number[] = [];
  protected selectedStaffId: number | null = null;
  protected selectedStaffForGen: any = null;
  
  protected showModal = false;
  protected addMode = true;
  protected isLoading = false;

  // Form Definíció
  protected staffForm = this.builder.group({
    id: [0],
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['1'],
    specialty: ['', Validators.required],
    bio: [''],
    isAvailable: [true],
    isActive: [true]
  });

  ngOnInit() {
    this.getStaffs();
    this.loadConsultations();
  }

  // --- Adatbetöltés ---
  getStaffs() {
    this.api.getStaff().subscribe({
      next: (res: any) => {
        const rawData = res.data || res || [];
        this.staffs = rawData.map((s: any) => {
          const profile = s.staffProfile || s.user || s.User || {};
          return {
            ...s,
            id: s.id,
            userId: s.userId || profile.id,
            name: profile.name || s.name || this.translate.instant('COMMON.UNKNOWN_NAME'),
            email: profile.email || s.email || this.translate.instant('COMMON.NO_EMAIL'),
            user: s.user || { name: this.translate.instant('COMMON.UNKNOWN_NAME') },
            role: (s.roleId || profile.roleId || s.role || '1').toString(),
            isActive: s.isActive ?? true,
            isAvailable: s.isAvailable ?? true,
          };
        });
      },
      error: (err) => {
        const errorTitle = this.translate.instant('COMMON.ERROR.TITLE') || 'Error';
        const errorText = err.error?.message || this.translate.instant('COMMON.ERROR.SERVER_ERROR');
        Swal.fire({
          title: errorTitle,
          text: errorText,
          icon: 'error',
          confirmButtonColor: '#003366',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  loadConsultations() {
    this.consultationService.getConsultations().subscribe({
      next: (res: any) => this.allConsultations = Array.isArray(res) ? res : (res.data || [])
    });
  }

  // --- Modal Kezelése ---
  startshowModal() {
    this.addMode = true;
    this.selectedStaffId = null;
    this.selectedTreatments = [];
    this.staffForm.reset({ id: 0, role: '1', isAvailable: true, isActive: true });
    this.showModal = true;
  }

  startEdit(staff: any) {
    this.addMode = false;
    this.selectedStaffId = staff.id;
    this.selectedStaffForGen = staff;
    this.selectedTreatments = [];

    this.staffForm.patchValue({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      specialty: staff.specialty || '',
      bio: staff.bio || '',
      isAvailable: staff.isAvailable,
      isActive: staff.isActive
    });

    this.api.getTreatmentsForStaff(staff.id).subscribe({
      next: (res: any) => {
        const currentTreatments = res.data || res || [];
        this.selectedTreatments = Array.isArray(currentTreatments) ? currentTreatments.map((t: any) => t.id) : [];
      }
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.staffForm.reset();
  }

  // --- Mentés ---
  save() {
    if (this.staffForm.invalid) {
      Swal.fire(this.translate.instant('COMMON.ATTENTION'), this.translate.instant('USERS.MESSAGES.ALL_FIELDS_REQUIRED'), 'warning');
      return;
    }
    this.addMode ? this.addStaff() : this.updateStaff();
  }

  addStaff() {
    const rawData = this.staffForm.getRawValue();
    const { role, password, ...rest } = rawData;
    const payload: any = { ...rest, roleId: Number(role), treatmentIds: this.selectedTreatments, isActive: true };
    
    if (typeof password === 'string' && password.trim() !== '') {
      payload.password = password;
    }

    this.api.addStaff(payload).subscribe({
      next: () => this.completeAction(this.translate.instant('STAFF.MESSAGES.ADD_SUCCESS')),
      error: (err) => {
        const errorKey = err.error?.message || 'COMMON.ERROR_GENERAL';
        const translatedMessage = this.translate.instant(errorKey);

        Swal.fire(
          this.translate.instant('COMMON.ERROR_TITLE'), 
          translatedMessage, 
          'error'
        );
      }
    });
  }
  
  updateStaff() {
    if (!this.selectedStaffId || !this.selectedStaffForGen?.userId) return;
    
    const rawData = this.staffForm.getRawValue();
    const { role, password, ...rest } = rawData;
    
    const updateData: any = { 
      ...rest, 
      userId: this.selectedStaffForGen.userId, 
      roleId: Number(role), 
      treatmentIds: this.selectedTreatments 
    };

    if (typeof password === 'string' && password.trim().length >= 6) {
      updateData.password = password;
    }

    this.api.updateStaff(this.selectedStaffForGen.userId, updateData).subscribe({
      next: () => {
        this.api.assignTreatments(this.selectedStaffForGen.userId, this.selectedTreatments).subscribe({
          next: () => this.completeAction(this.translate.instant('STAFF.MESSAGES.UPDATE_SUCCESS')),
          error: () => this.completeAction(this.translate.instant('STAFF.MESSAGES.ASSIGN_ERROR'))
        });
      },
      error: (err) => {
        const errorKey = err.error?.message || 'COMMON.ERROR_GENERAL';
        Swal.fire(this.translate.instant('COMMON.ERROR_TITLE'), this.translate.instant(errorKey), 'error');
      }
    });
  }

  // --- Időpont Generálás ---
  generateAutoSlots(staff?: any) {
    const s = staff || this.selectedStaffForGen;
    if (!s) return;
   
    const consultationId = s.treatments?.[0]?.id || (this.selectedTreatments.length > 0 ? this.selectedTreatments[0] : null);
    if (!consultationId) {
      Swal.fire(this.translate.instant('COMMON.ATTENTION'), this.translate.instant('STAFF.MESSAGES.NO_CONSULTATION'), 'warning');
      return;
    }

    Swal.fire({
      title: this.translate.instant('STAFF.GENERATE_SLOTS_TITLE'),
      html: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <label>Start: <input type="time" id="start" class="swal2-input" value="08:00"></label>
          <label>End: <input type="time" id="end" class="swal2-input" value="19:00"></label>
          <label>Interval: 
            <select id="duration" class="swal2-input">
              <option value="30" selected>30 min</option>
              <option value="60">60 min</option>
            </select>
          </label>
        </div>`,
      confirmButtonText: this.translate.instant('COMMON.GENERATE'),
      showCancelButton: true,
      preConfirm: () => ({
        startTime: (document.getElementById('start') as HTMLInputElement).value,
        endTime: (document.getElementById('end') as HTMLInputElement).value,
        interval: (document.getElementById('duration') as HTMLSelectElement).value
      })
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading = true;

        const payload = {
          staffId: Number(s.id),
          consultationId: Number(consultationId),
          startTime: result.value.startTime,
          endTime: result.value.endTime,
          interval: Number(result.value.interval),
          startDate: new Date().toLocaleDateString('sv-SE'),
          endDate: new Date(Date.now() + 12096e5).toLocaleDateString('sv-SE')
        };

        this.bookingApi.generateStaffSlots(payload).subscribe({
          next: (res: any) => { 
            this.isLoading = false;
            const successMsg = this.translate.instant('STAFF.MESSAGES.SLOTS_GENERATED', { count: res.count }) 
                     || `${res.count} idősáv létrejött.`;
            Swal.fire(this.translate.instant('COMMON.SUCCESS'), successMsg, 'success');
          },
          error: (err) => { 
            this.isLoading = false;
            const errorKey = err.error?.message || 'COMMON.ERROR_GENERAL';
            Swal.fire(this.translate.instant('COMMON.ERROR_TITLE'), this.translate.instant(errorKey), 'error');
            }
        });
      }
    });
  }

  // --- Egyéb Műveletek ---
  deleteStaff(id: number) {
    const staff = this.staffs.find(s => s.id === id);
    const targetUserId = staff?.userId || id;
    Swal.fire({
      title: this.translate.instant('USERS.MESSAGES.ARCHIVE_CONFIRM_TITLE'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('SERVICES.MESSAGES.CONFIRM_DELETE'),
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.archiveUser(targetUserId).subscribe({
          next: () => { 
            this.getStaffs(); 
            Swal.fire(this.translate.instant('COMMON.SUCCESS'), '', 'success');
          }
        });
      }
    });
  }

  restoreStaff(staff: any) {
    const targetUserId = staff.userId || staff.id;
    this.api.updateStaff(targetUserId, { ...staff, isActive: true }).subscribe({
      next: () => { this.getStaffs(); Swal.fire('Success', '', 'success'); },
      error: (err) => {
        const errorKey = err.error?.message || 'COMMON.ERROR_GENERAL';
        Swal.fire(this.translate.instant('COMMON.ERROR_TITLE'), this.translate.instant(errorKey), 'error');
      }
    });
  }

  toggleTreatment(id: number) {
    const index = this.selectedTreatments.indexOf(id);
    index > -1 ? this.selectedTreatments.splice(index, 1) : this.selectedTreatments.push(id);
  }

  completeAction(msg: string) {
    this.showModal = false;
    this.getStaffs();
    Swal.fire({ icon: 'success', title: msg, timer: 1500, showConfirmButton: false });
  }

  viewBookings(id: number) {
    this.router.navigate(['/booking'], { queryParams: { staffId: id } });
  }
}