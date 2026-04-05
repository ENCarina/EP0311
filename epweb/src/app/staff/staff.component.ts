import { Component, inject, OnInit } from '@angular/core';
import { StaffService } from '../shared/staff.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2'
import { AuthService } from '../shared/auth.service';
import { CommonModule } from '@angular/common';
import { BookingService } from '../shared/booking.service';
import { ConsultationService } from '../shared/consultation.service';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { interval } from 'rxjs';

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
  protected selectedStaffId: number | null = null;
  protected allConsultations: any[] = [];
  protected selectedTreatments: number[] = [];
  protected showModal = false;
  protected addMode = true;
  protected isLoading = false;

  protected staffForm = this.builder.group({
    id: [0],
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    role: ['1'],
    specialty: ['', Validators.required],
    bio: [''],
    isAvailable: [true],
    isActive: [true],
    generateSlots: [false],
    slotDuration: [60],     
    startTime: ['08:00'],   
    endTime: ['19:00'],     
    days: [['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']] 
    });

  ngOnInit() {
    this.getStaffs();
    this.loadConsultations();
  }

  loadConsultations() {
    this.consultationService.getConsultations().subscribe({
      next: (res: any) => this.allConsultations = Array.isArray(res) ? res : (res.data || [])
    });
  }

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
            role: profile.roleId?.toString() || s.roleId?.toString() || s.role?.toString() || '1',
            isActive: s.isActive ?? true,
            isAvailable: s.isAvailable ?? true
          };
        });
      },
      error: (err) => {
        Swal.fire(
          this.translate.instant('COMMON.ERROR'),
          this.translate.instant('COMMON.LOADING_ERROR'),
          'error'
        );
      }
    });
  }

  startEdit(staff: any) {
    this.addMode = false;
    this.selectedStaffId = staff.id;
    this.selectedTreatments = [];

    this.staffForm.patchValue({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role ? staff.role.toString() : '1',
      specialty: staff.specialty || '',
      bio: staff.bio || '',
      isAvailable: staff.isAvailable ?? true,
      isActive: staff.isActive ?? true,
    });
    this.showModal = true;

    this.api.getTreatmentsForStaff(staff.id).subscribe({
      next: (res: any) => {
        const currentTreatments = res.data || res || [];
        this.selectedTreatments = Array.isArray(currentTreatments)
          ? currentTreatments.map((t: any) => t.id)
          : [];
      },
      error: (err: any) => console.warn(this.translate.instant('SERVICES.MESSAGES.TREATMENTS_LOAD_ERROR'), err)
    });
  }

  addStaff() {
    const rawData = this.staffForm.getRawValue();
    const { id, role, password, ...rest } = rawData;

    const payload: any = {
      ...rest,
      roleId: Number(role),
      treatmentIds: this.selectedTreatments,
      isActive: true
    };

    if (password && password.trim() !== '') {
      payload.password = password;
    }

    this.api.addStaff(payload).subscribe({
      next: (res: any) => {
        const newStaffId = res.data?.id || res.id;
        if (this.selectedTreatments.length > 0 && newStaffId) {
          this.api.assignTreatments(newStaffId, this.selectedTreatments).subscribe({
            next: () => this.completeAction(this.translate.instant('STAFF.MESSAGES.ADD_SUCCESS')),
            error: () => this.completeAction(this.translate.instant('STAFF.MESSAGES.ASSIGN_ERROR'))
          });
        } else {
          this.completeAction(this.translate.instant('STAFF.MESSAGES.ADD_SUCCESS'));
        }
      },
      error: (err: any) => {
        Swal.fire(this.translate.instant('COMMON.ERROR'), err.error?.message || this.translate.instant('COMMON.GENERIC_ERROR'), 'error');
      }
    });
  }

  toggleTreatment(id: number) {
    const index = this.selectedTreatments.indexOf(id);
    if (index > -1) {
      this.selectedTreatments.splice(index, 1);
    } else {
      this.selectedTreatments.push(id);
    }
  }

  completeAction(message: string) {
    this.showModal = false;
    this.staffForm.reset({ id: 0, role: '1', isAvailable: true, isActive: true });
    this.selectedTreatments = [];
    this.getStaffs();
    Swal.fire({ icon: 'success', title: message, timer: 1500, showConfirmButton: false });
  }

  save() {
    if (this.staffForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: this.translate.instant('COMMON.ATTENTION'),
        text: this.translate.instant('USERS.MESSAGES.ALL_FIELDS_REQUIRED')
      });
      return;
    }
    this.addMode ? this.addStaff() : this.updateStaff();
  }

  updateStaff() {
    const staffId = this.selectedStaffId;
    if (!staffId) {
      Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('STAFF.MESSAGES.INVALID_ID'), 'error');
      return;
    }

    const currentStaff = this.staffs.find(s => s.id === staffId);
    const targetUserId = currentStaff?.userId;

    if (!targetUserId) {
      Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('STAFF.MESSAGES.INVALID_ID'), 'error');
      return;
    }

    const rawData = this.staffForm.getRawValue();
    const { id, role, password, ...rest } = rawData;

    const updateData: any = {
      ...rest,
      userId: targetUserId,
      roleId: Number(role),
      treatmentIds: this.selectedTreatments
    };

    if (password && password.trim() !== '') {
      updateData.password = password;
    }

    this.api.updateStaff(targetUserId, updateData).subscribe({
      next: () => {
        this.api.assignTreatments(targetUserId, this.selectedTreatments).subscribe({
          next: () => {
            this.completeAction(this.translate.instant('STAFF.MESSAGES.UPDATE_SUCCESS'));},
          error: () => {
            this.completeAction(this.translate.instant('STAFF.MESSAGES.ASSIGN_ERROR'));
          }
          });
      },
      error: (err: any) => {
        Swal.fire(this.translate.instant('COMMON.ERROR'), err.error?.message || this.translate.instant('COMMON.GENERIC_ERROR'), 'error');
      }
    });
  }
   generateAutoSlots(staff: any) {
      console.log('Orvos objektum:', staff);
      console.log('Küldött Staff ID:', staff.id);
    Swal.fire({
      title: this.translate.instant('STAFF.GENERATE_SLOTS_TITLE') || 'Generate Weekly Slots',
      html: `
       <div style="display: flex; flex-direction: column; gap: 10px;">
        <label>Start Time: <input type="time" id="start" class="swal2-input" value="08:00"></label>
        <label>End Time: <input type="time" id="end" class="swal2-input" value="19:00"></label>
        <label>Duration: 
          <select id="duration" class="swal2-input">
            <option value="15">15 min</option>
            <option value="30" selected>30 min</option>
            <option value="60">60 min</option>
          </select>
        </label>
      </div>
      `,
      confirmButtonText: this.translate.instant('COMMON.GENERATE') || 'Generate',
      showCancelButton: true,
      preConfirm: () => {
        return {
          startTime: (document.getElementById('start') as HTMLInputElement).value,
          endTime: (document.getElementById('end') as HTMLInputElement).value,
          interval: (document.getElementById('duration') as HTMLSelectElement).value
        }
      }
   }).then((result) => {
      if (result.isConfirmed) {
        const today = new Date();
        const startDate = today.toLocaleDateString('sv-SE');

        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(today.getDate() + 30);
        const endDate = thirtyDaysLater.toLocaleDateString('sv-SE');

        const payload = {
          staffId: Number(staff.id),
          startTime: result.value.startTime,
          endTime: result.value.endTime,
          interval: Number(result.value.interval),
          startDate: startDate,
          endDate: endDate,
          consultationId: Number(
            (this.selectedTreatments && this.selectedTreatments.length > 0) 
              ? this.selectedTreatments[0] 
              : (staff.consultationId || 1)
          )
        };

        this.isLoading = true;
        this.bookingApi.generateStaffSlots(payload).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            const successMsg = this.translate.instant(res.message || 'STAFF.MESSAGES.ADD_SUCCESS');
            Swal.fire(this.translate.instant('COMMON.SUCCESS'), successMsg, 'success');
        },
          error: (err: any) => {
            this.isLoading = false;
            console.error('Slot generation error:', err);

            const errorKey = err.error?.message || 'COMMON.ERROR';
            Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant(errorKey), 'error');
          }
        });
      }
    });
  }
 
  viewBookings(staffId: number): void {
    this.router.navigate(['/booking'], { queryParams: { staffId: staffId } });
  }

  startshowModal() {
    this.addMode = true;
    this.selectedTreatments = [];
    this.staffForm.reset({ id: 0, role: '1', isAvailable: true, isActive: true });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.staffForm.reset();
  }

  deleteStaff(id: number) {
    const staff = this.staffs.find(s => s.id === id);
    const targetUserId = staff?.userId || id;

    Swal.fire({
      title: this.translate.instant('USERS.MESSAGES.ARCHIVE_CONFIRM_TITLE'),
      text: this.translate.instant('USERS.MESSAGES.ARCHIVE_CONFIRM_TEXT'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: this.translate.instant('SERVICES.MESSAGES.CONFIRM_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.archiveUser(targetUserId).subscribe({
          next: () => {
            this.getStaffs();
            Swal.fire(this.translate.instant('COMMON.SUCCESS'), this.translate.instant('USERS.MESSAGES.ARCHIVE_SUCCESS'), 'success');
          }
        });
      }
    });
  }

  restoreStaff(staff: any) {
    const targetId = staff.userId;

    this.api.updateStaff(targetId, { isActive: true }).subscribe({
      next: () => {
        this.completeAction(this.translate.instant('STAFF.MESSAGES.RESTORE_SUCCESS'));
      },
      error: (err) => {
        Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('STAFF.MESSAGES.RESTORE_ERROR'), 'error');
      }
    });
  }
}