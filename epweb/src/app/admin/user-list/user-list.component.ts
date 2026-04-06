import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../shared/admin.service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
  users: any[] = [];
  private readonly navyColor = '#001f3f';
  private readonly specialtyOptions: Record<string, string> = {
    'Kardiológus': 'Kardiológus',
    'Fogorvos': 'Fogorvos',
    'Pszichiáter': 'Pszichiáter',
    'Bőrgyógyász': 'Bőrgyógyász',
    'Ortopéd szakorvos': 'Ortopéd szakorvos',
    'Szemész': 'Szemész',
    'Urológus': 'Urológus',
    'Nőgyógyász': 'Nőgyógyász',
    'Neurológus': 'Neurológus',
    'Endokrinológus': 'Endokrinológus',
    'Pulmonológus': 'Pulmonológus',
    'Fül-orr-gégész': 'Fül-orr-gégész',
    'Gasztroenterológus': 'Gasztroenterológus',
    'Reumatológus': 'Reumatológus',
    'Diabetológus': 'Diabetológus'
  };

  constructor(private adminService: AdminService, private translate: TranslateService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
   this.adminService.getAllUsers().subscribe({
    next: (res: any) => {
     
      const data = Array.isArray(res) ? res : (res.data || []);
       
      this.users = data.map((u: any) => {
        const hasStaffProfile = !!u.staffProfile;
        let activeStatus: boolean;
        if (hasStaffProfile) {
          activeStatus = u.staffProfile.isActive === true || u.staffProfile.isActive === 1;
        } else {
          // Sima felhasználóknál (vagy Adminnál staff profil nélkül)
          activeStatus = u.isActive !== undefined ? Boolean(u.isActive) : true;
        }
        return{
          ...u,
          isActive: activeStatus
        };
    }),
    console.log('Sikeresen feldolgozott felhasználók:', this.users)
  },
    error: (err) => {
      console.error(this.translate.instant('ADMIN_USERS.LOAD_ERROR_LOG'), err);
      Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('ADMIN_USERS.LOAD_ERROR'), 'error');
    }
  });
}
onToggleActive(user: any) {
  // 1. Meghatározzuk az új státuszt 
  const newStatus = !user.isActive;
  const userId = user.id;

  this.adminService.updateUserStatus(userId, newStatus).subscribe({
    next: () => {
      user.isActive = newStatus;
      
      if (user.staffProfile) {
        user.staffProfile.isActive = newStatus;
      }
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });

      Toast.fire({
        icon: 'success',
        title: this.translate.instant(newStatus ? 'ADMIN_USERS.USER_ACTIVATED' : 'ADMIN_USERS.USER_ARCHIVED')
      });
    },
    error: (err) => {
      console.error(this.translate.instant('ADMIN_USERS.STATUS_ERROR_LOG'), err);
      if (err.status === 404) {
        Swal.fire({
          title: this.translate.instant('COMMON.ERROR'),
          text: this.translate.instant('ADMIN_USERS.MISSING_STAFF_PROFILE'),
          icon: 'error'
        });
      } else {
        Swal.fire({
          title: this.translate.instant('COMMON.ERROR'),
          text: this.translate.instant('ADMIN_USERS.STATUS_SERVER_ERROR'),
          icon: 'error',
          confirmButtonColor: '#001f3f'
        });
      }
    }
  });
}

onResetPassword(user: any) {
  Swal.fire({
    title: `${this.translate.instant('ADMIN_USERS.RESET_PASSWORD_TITLE')}: ${user.name}`,
    input: 'password',
    inputLabel: this.translate.instant('ADMIN_USERS.NEW_PASSWORD'),
    inputPlaceholder: this.translate.instant('ADMIN_USERS.PASSWORD_PLACEHOLDER'),
    showCancelButton: true,
    confirmButtonText: this.translate.instant('ADMIN_USERS.SAVE'),
    cancelButtonText: this.translate.instant('COMMON.CANCEL'),
    inputValidator: (value) => {
      if (!value || value.length < 6) return this.translate.instant('ADMIN_USERS.PASSWORD_MIN');
        return null;
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const payload = { password: result.value, confirmPassword: result.value };
      
      this.adminService.resetPassword(user.id, payload).subscribe({
        next: (res) => {
          Swal.fire(this.translate.instant('CONSULTATION.SUCCESS_TITLE'), this.translate.instant('ADMIN_USERS.PASSWORD_UPDATED'), 'success');
        },
        error: (err) => {
          Swal.fire(this.translate.instant('COMMON.ERROR'), err.error.message || this.translate.instant('ADMIN_USERS.UPDATE_FAILED'), 'error');
        }
      });
    }
  });
}
onPromoteToStaff(user: any) {
  Swal.fire({
    title: this.translate.instant('ADMIN_USERS.PROMOTE_TITLE'),
    text: `${this.translate.instant('ADMIN_USERS.PROMOTE_TEXT')} ${user.name}`,
    input: 'select',
    inputOptions: this.specialtyOptions,
  inputLabel: this.translate.instant('ADMIN_USERS.SPECIALTY_LABEL'),
    showCancelButton: true,
    confirmButtonText: this.translate.instant('ADMIN_USERS.PROMOTE_CONFIRM'),
    cancelButtonText: this.translate.instant('COMMON.CANCEL'),
    confirmButtonColor: this.navyColor,
    inputValidator: (value) => {
      if (!value) return this.translate.instant('ADMIN_USERS.SPECIALTY_REQUIRED');
      return null;
      }
  }).then((result) => {
    if (result.isConfirmed) {
      this.adminService.promoteUser(user.id, { specialty: result.value }).subscribe({
        next: () => {
          Swal.fire(this.translate.instant('CONSULTATION.SUCCESS_TITLE'), this.translate.instant('ADMIN_USERS.STATUS_UPDATED'), 'success');
          this.loadUsers(); // Lista frissítése
        },
        error: (err:any) => Swal.fire(this.translate.instant('COMMON.ERROR'), err.error.message || this.translate.instant('ADMIN_USERS.ACTION_FAILED'), 'error')
      });
    }
  });
}

onEditUser(user: any) {
    Swal.fire({
      title: `${user.name} ${this.translate.instant('ADMIN_USERS.EDIT_TITLE_SUFFIX')}`,
      html: `
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">${this.translate.instant('PROFILE.NAME')}</label>
          <input type="text" id="edit-name" class="swal2-input m-0 w-100" value="${user.name}">
        </div>
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">${this.translate.instant('ADMIN_USERS.EMAIL')}</label>
          <input type="email" id="edit-email" class="swal2-input m-0 w-100" value="${user.email}">
        </div>
      `,
      confirmButtonText: this.translate.instant('ADMIN_USERS.SAVE'),
      confirmButtonColor: this.navyColor,
      showCancelButton: true,
      preConfirm: () => {
        const name = (document.getElementById('edit-name') as HTMLInputElement).value;
        const email = (document.getElementById('edit-email') as HTMLInputElement).value;
        if (!name || !email) Swal.showValidationMessage(this.translate.instant('ADMIN_USERS.FILL_ALL_FIELDS'));
        return { name, email };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        // Itt hívjuk meg a backendet
      this.adminService.updateUser(user.id, result.value).subscribe({
        next: () => {
          Swal.fire(this.translate.instant('CONSULTATION.SUCCESS_TITLE'), this.translate.instant('ADMIN_USERS.DATA_UPDATED'), 'success');
          this.loadUsers(); // Frissítjük a listát, hogy lássuk a változást
        },
        error: (err:any) => Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('ADMIN_USERS.SAVE_FAILED'), 'error')
      });
    }
  });
}
  onArchive(id: number) {
    Swal.fire({
      title: this.translate.instant('ADMIN_USERS.ARCHIVE_CONFIRM_TITLE'),
      text: this.translate.instant('ADMIN_USERS.ARCHIVE_CONFIRM_TEXT'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('ADMIN_USERS.ARCHIVE_CONFIRM_BTN')
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.archiveUser(id).subscribe({
          next: () => {
            Swal.fire(this.translate.instant('ADMIN_USERS.ARCHIVED_TITLE'), this.translate.instant('ADMIN_USERS.ARCHIVED_TEXT'), 'success');
            this.loadUsers(); 
          },
          error: (err) => {
          Swal.fire(this.translate.instant('COMMON.ERROR'), err.error?.message || this.translate.instant('ADMIN_USERS.ACTION_FAILED'), 'error');
        }
        });
      }
    });
  }

  protected translateSpecialty(specialty: string | null | undefined): string {
    if (!specialty) {
      return this.translate.instant('STAFF.DEFAULT_SPECIALTY');
    }

    const key = this.toTranslationKey(specialty);
    const translated = this.translate.instant(`SPECIALTY_NAMES.${key}`);
    return translated !== `SPECIALTY_NAMES.${key}` ? translated : specialty;
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
