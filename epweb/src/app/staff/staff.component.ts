import { Component, inject, OnInit } from '@angular/core';
import { StaffService } from '../shared/staff.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import Swal from 'sweetalert2'
import { AuthService } from '../shared/auth.service';
import { CommonModule } from '@angular/common';
import { BookingService } from '../shared/booking.service';
import { ConsultationService } from '../shared/consultation.service';
import { Router } from '@angular/router';
import { AdminService } from '../shared/admin.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-staff',
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css',
})
  export class StaffComponent implements OnInit{
    private readonly router = inject(Router);
    protected readonly api = inject(StaffService)
    protected readonly consultationService = inject(ConsultationService)
    protected readonly builder = inject(FormBuilder)
    public readonly auth = inject(AuthService);
    private readonly bookingApi = inject(BookingService);
    private readonly adminService = inject(AdminService);
    private readonly translate = inject(TranslateService);

    protected staffs: any[] = [];
    protected eligibleUsers: any[] = [];
    protected selectedStaffId: number | null = null;
    protected allConsultations: any[] = [];
    protected selectedTreatments: number[] = [];
    protected showModal = false;
    protected addMode = true;

    protected staffForm = this.builder.group({
      id:[0],
      userId:[0],
      name:['', [Validators.required, Validators.minLength(3)]],
      email:['', [Validators.required, Validators.email]],
      password: [''],
      role:['1'],
      specialty:['', Validators.required],
      bio:[''],
      isAvailable:[true], 
      isActive:[true]
    })

    private configureFormMode(addMode: boolean) {
      const userIdControl = this.staffForm.get('userId');
      const nameControl = this.staffForm.get('name');
      const emailControl = this.staffForm.get('email');

      if (addMode) {
        userIdControl?.setValidators([Validators.required, Validators.min(1)]);
        nameControl?.clearValidators();
        emailControl?.clearValidators();
      } else {
        userIdControl?.clearValidators();
        nameControl?.setValidators([Validators.required, Validators.minLength(3)]);
        emailControl?.setValidators([Validators.required, Validators.email]);
      }

      userIdControl?.updateValueAndValidity();
      nameControl?.updateValueAndValidity();
      emailControl?.updateValueAndValidity();
    }

    ngOnInit() {
      this.getStaffs();
      this.loadConsultations();
      this.loadEligibleUsers();
      this.configureFormMode(this.addMode);
    }

    loadEligibleUsers() {
      this.adminService.getAllUsers().subscribe({
        next: (users: any[]) => {
          this.eligibleUsers = (users || []).filter((user: any) => {
            const hasStaffProfile = !!user.staffProfile;
            const isAdmin = Number(user.roleId) === 2;
            const isActive = user.isActive !== false;
            return !hasStaffProfile && !isAdmin && isActive;
          });
        },
        error: (err) => {
          console.error(this.translate.instant('ADMIN_STAFF.ELIGIBLE_USERS_LOAD_ERROR_LOG'), err);
          this.eligibleUsers = [];
        }
      });
    }

    loadConsultations() {
      this.consultationService.getConsultations().subscribe({
        next: (res: any) => this.allConsultations = Array.isArray(res) ? res : (res.data || [])
      });
    }
    getStaffs() {
      this.api.getStaff().subscribe({
        next: (res:any) => {
          const rawData = res.data || res || [];
          this.staffs = rawData.map((s: any) => {
            const profile = s.staffProfile || s.user || s.User || {};
            return{
              ...s,
              id: s.id,
              userId: s.userId || profile.id,
              name: profile.name || s.name || this.translate.instant('STAFF.ANONYMOUS'),
              email: profile.email || s.email || this.translate.instant('ADMIN_STAFF.NO_EMAIL'),
              role: profile.roleId?.toString() || s.roleId?.toString() || s.role?.toString() || '1',
              isActive: s.isActive ?? true,
              isAvailable: s.isAvailable ?? true
            };  
        }),
        console.log(this.translate.instant('ADMIN_STAFF.STAFF_LIST_LOG'), this.staffs);
      },
        error: (err) => {
        console.error(this.translate.instant('ADMIN_STAFF.LOAD_ERROR_LOG'), err); 
        Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('ADMIN_STAFF.LOAD_ERROR'), 'error');
      }
    });
  }
    startEdit(staff: any) {
    
        this.addMode = false;
        this.configureFormMode(false);
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
            error:(err:any) => console.warn(this.translate.instant('ADMIN_STAFF.TREATMENTS_LOAD_ERROR_LOG'), err)
          });
        }

    addStaff() {
      const selectedUserId = Number(this.staffForm.get('userId')?.value);
      const specialty = String(this.staffForm.get('specialty')?.value || '').trim();

      if (!selectedUserId) {
        Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('ADMIN_STAFF.SELECT_USER_REQUIRED'), 'error');
        return;
      }

      if (!specialty) {
        Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('ADMIN_STAFF.SPECIALTY_REQUIRED'), 'error');
        return;
      }

      this.api.promoteUser(selectedUserId, { specialty, treatmentIds: this.selectedTreatments }).subscribe({
        next: () => {
          this.completeAction(this.translate.instant('ADMIN_STAFF.ADD_SUCCESS'));
        },
        error: (err: any) => {
          console.error(this.translate.instant('ADMIN_STAFF.PROMOTION_ERROR_LOG'), err);
          Swal.fire(this.translate.instant('COMMON.ERROR'), err.error?.message || this.translate.instant('ADMIN_STAFF.PROMOTION_FAILED'), 'error');
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
      this.staffForm.reset({ id: 0, userId: 0, role: '1', isAvailable: true, isActive: true });
      this.selectedTreatments = [];
      this.getStaffs();
      this.loadEligibleUsers();
      Swal.fire({ icon: 'success', title: message, timer: 1500, showConfirmButton: false });
    }

    save() {
      if (this.staffForm.invalid) {
        alert(this.translate.instant('ADMIN_STAFF.FILL_REQUIRED_FIELDS'));
        return;
      }
      this.addMode ? this.addStaff() : this.updateStaff();
    }
  
    updateStaff() {
      const staffId = this.selectedStaffId; // Ez a Staff tábla ID-ja (pl. 6)
      if (!staffId) {
        Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('ADMIN_STAFF.MISSING_STAFF_ID'), 'error');
        return;
      }
      // 1. Megkeressük a valódi USER ID-t
      const currentStaff = this.staffs.find(s => s.id === staffId);
      const targetUserId = currentStaff?.userId; 

      if (!targetUserId) {
        Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('ADMIN_STAFF.MISSING_USER_ID'), 'error');
        return;
      }

  // 2. Adatok előkészítése
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

  // 3. API hívás 
  this.api.updateStaff(targetUserId, updateData).subscribe({
    next: () => {
      // 4. Kezelések frissítése 
      this.api.assignTreatments(targetUserId, this.selectedTreatments).subscribe({
        next: () => {
          this.completeAction(this.translate.instant('ADMIN_STAFF.UPDATE_SUCCESS'));
          this.getStaffs(); // Lista frissítése
        },
        error: (err) => {
          console.error(this.translate.instant('ADMIN_STAFF.TREATMENTS_SAVE_ERROR_LOG'), err);
          this.completeAction(this.translate.instant('ADMIN_STAFF.UPDATE_PARTIAL_SUCCESS'));
        }
      });
    },
    error: (err: any) => {
      console.error(this.translate.instant('ADMIN_STAFF.UPDATE_ERROR_LOG'), err);
      Swal.fire(this.translate.instant('COMMON.ERROR'), err.error?.message || this.translate.instant('ADMIN_STAFF.UPDATE_FAILED'), 'error');
    }
  });
}

    viewBookings(staffId: number): void {
      this.router.navigate(['/booking'], { queryParams: { staffId: staffId } });
    }

    startshowModal() {
      this.addMode = true;
      this.configureFormMode(true);
      this.selectedTreatments = [];
      this.staffForm.reset({ id: 0, userId: 0, role: '1', isAvailable: true, isActive: true });
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
        title: this.translate.instant('ADMIN_STAFF.ARCHIVE_CONFIRM_TITLE'),
        text: this.translate.instant('ADMIN_STAFF.ARCHIVE_CONFIRM_TEXT'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: this.translate.instant('ADMIN_STAFF.ARCHIVE_CONFIRM_BTN'),
        cancelButtonText: this.translate.instant('COMMON.CANCEL')
      }).then((result) => {
        if (result.isConfirmed) {
          this.api.archiveUser(targetUserId).subscribe({
            next: () => {
              this.getStaffs();
              Swal.fire(this.translate.instant('ADMIN_STAFF.ARCHIVED_TITLE'), this.translate.instant('ADMIN_STAFF.ARCHIVED_TEXT'), 'success');
            },
            error: (err) => Swal.fire(this.translate.instant('COMMON.ERROR'), err.error?.message || this.translate.instant('ADMIN_STAFF.ACTION_FAILED'), 'error')  
          });
        } 
      });
    }

    restoreStaff(staff: any) {
      const targetId = staff.userId;

      this.api.updateStaffStatus(targetId, true).subscribe({
        next: () => {
          staff.isActive = true;
          staff.isAvailable = true;
          this.getStaffs(); 

          Swal.fire({
            icon: 'success',
            title: this.translate.instant('ADMIN_STAFF.RESTORE_SUCCESS'),
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error(this.translate.instant('ADMIN_STAFF.RESTORE_ERROR_LOG'), err);
          Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('ADMIN_STAFF.RESTORE_FAILED'), 'error');
        }
      });
    }

    protected translateSpecialty(specialty: string | null | undefined): string {
      if (!specialty) {
        return '—';
      }

      const key = this.toTranslationKey(specialty);
      const translated = this.translate.instant(`SPECIALTY_NAMES.${key}`);
      return translated !== `SPECIALTY_NAMES.${key}` ? translated : specialty;
    }

    protected translateServiceName(serviceName: string | null | undefined): string {
      if (!serviceName) {
        return this.translate.instant('CONSULTATION.GENERAL');
      }

      const key = this.toTranslationKey(serviceName);
      const translated = this.translate.instant(`SERVICE_NAMES.${key}`);
      return translated !== `SERVICE_NAMES.${key}` ? translated : serviceName;
    }

    protected getRoleLabel(role: string | number | null | undefined): string {
      switch (Number(role)) {
        case 2:
          return this.translate.instant('PROFILE.ADMIN');
        case 3:
          return this.translate.instant('ADMIN_STAFF.ASSISTANT');
        case 1:
        default:
          return this.translate.instant('PROFILE.DOCTOR');
      }
    }

    private toTranslationKey(value: string): string {
      return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toUpperCase();
    }
  }