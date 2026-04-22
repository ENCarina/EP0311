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

  constructor(
    private adminService: AdminService,
    public translate: TranslateService
  ) {}

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
            activeStatus = u.isActive !== undefined ? Boolean(u.isActive) : true;
          }
          
          return { 
            ...u, 
            isActive: activeStatus,
            roleId: u.roleId ?? (u.staffProfile ? 1 : 0)
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

  onToggleActive(user: any) {
    const newStatus = !user.isActive;
    const userId = user.id;

    this.adminService.updateUserStatus(userId, newStatus).subscribe({
      next: (res:any) => {
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
          title: this.translate.instant(res.message || 'USERS.MESSAGES.STATUS_UPDATED_SUCCESS')
        });
      },
      error: (err) => {
        Swal.fire({
          title: this.translate.instant('COMMON.ERROR'),
          text: err.status === 404 
            ? this.translate.instant('USERS.MESSAGES.PROFILE_NOT_FOUND') 
            : this.translate.instant('COMMON.GENERIC_ERROR'),
          icon: 'error',
          confirmButtonColor: this.navyColor
        });
      }
    });
  }

  onResetPassword(user: any) {
    Swal.fire({
      title: `${this.translate.instant('USERS.ACTIONS.RESET_PWD')}: ${user.name}`,
      input: 'password',
      inputLabel: this.translate.instant('USERS.MESSAGES.PWD_INPUT_LABEL'),
      inputPlaceholder: this.translate.instant('USERS.MESSAGES.PWD_PLACEHOLDER'),
      showCancelButton: true,
      confirmButtonText: this.translate.instant('COMMON.SAVE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: this.navyColor,
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return this.translate.instant('USERS.MESSAGES.PWD_VALIDATION');
        }
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const payload = { password: result.value, confirmPassword: result.value };
        this.adminService.resetPassword(user.id, payload).subscribe({
          next: () => {
            Swal.fire(
              this.translate.instant('COMMON.SUCCESS'),
              this.translate.instant('USERS.MESSAGES.PWD_SUCCESS'),
              'success'
            );
          },
          error: (err) => {
            Swal.fire(
              this.translate.instant('COMMON.ERROR'),
              err.error?.message || this.translate.instant('COMMON.GENERIC_ERROR'),
              'error'
            );
          }
        });
      }
    });
  }

  onPromoteToStaff(user: any) {
    Swal.fire({
      title: this.translate.instant('USERS.ACTIONS.PROMOTE'),
      text: `${this.translate.instant('USERS.MESSAGES.PROMOTE_TEXT')}: ${user.name}`,
      input: 'text',
      inputLabel: this.translate.instant('USERS.TABLE.ROLE'),
      inputPlaceholder: this.translate.instant('USERS.MESSAGES.ROLE_PLACEHOLDER'),
      showCancelButton: true,
      confirmButtonText: this.translate.instant('USERS.ACTIONS.PROMOTE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: this.navyColor,
      inputValidator: (value) => {
        if (!value) return this.translate.instant('USERS.MESSAGES.ROLE_REQUIRED');
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.promoteUser(user.id, { specialty: result.value }).subscribe({
          next: () => {
            Swal.fire(
              this.translate.instant('COMMON.SUCCESS'),
              this.translate.instant('USERS.MESSAGES.UPDATE_SUCCESS'),
              'success'
            );
            this.loadUsers();
          },
          error: (err: any) => {
            Swal.fire(
              this.translate.instant('COMMON.ERROR'),
              err.error?.message || this.translate.instant('COMMON.GENERIC_ERROR'),
              'error'
            );
          }
        });
      }
    });
  }

  onEditUser(user: any) {
    const currentSpecialty = user.staffProfile ? user.staffProfile.specialty : '';
    const currentRole = user.role || 'USER';

    Swal.fire({
      title: `${user.name} - ${this.translate.instant('USERS.ACTIONS.EDIT')}`,
      html: `
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">${this.translate.instant('USERS.TABLE.USER')}</label>
          <input type="text" id="edit-name" class="swal2-input m-0 w-100" value="${user.name}">
        </div>
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">${this.translate.instant('USERS.TABLE.EMAIL') || 'Email'}</label>
          <input type="email" id="edit-email" class="swal2-input m-0 w-100" value="${user.email}">
        </div>
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">${this.translate.instant('USERS.TABLE.ROLE') || 'Role'}</label>
          <select id="edit-role" class="swal2-select m-0 w-100" style="display: flex;">
            <option value="USER" ${currentRole === 'USER' ? 'selected' : ''}>User</option>
            <option value="STAFF" ${currentRole === 'STAFF' ? 'selected' : ''}>Staff / Doctor</option>
            <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        <div class="mb-3 text-start">
          <label class="form-label small fw-bold">${this.translate.instant('USERS.TABLE.SPECIALTY') || 'Specialty (e.g. DERMATOLOGY)'}</label>
          <input type="text" id="edit-specialty" class="swal2-input m-0 w-100" value="${currentSpecialty}" placeholder="DERMATOLOGY">
        </div>
      `,
      confirmButtonText: this.translate.instant('COMMON.SAVE'),
      confirmButtonColor: this.navyColor,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      preConfirm: () => {
        const name = (document.getElementById('edit-name') as HTMLInputElement).value;
        const email = (document.getElementById('edit-email') as HTMLInputElement).value;
        const role = (document.getElementById('edit-role') as HTMLSelectElement).value;
        const specialty = (document.getElementById('edit-specialty') as HTMLInputElement).value;

        if (!name || !email) {
          Swal.showValidationMessage(this.translate.instant('USERS.MESSAGES.ALL_FIELDS_REQUIRED'));
          return false;
        }
        return { name, email, role, specialty };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.updateUser(user.id, result.value).subscribe({
          next: () => {
            Swal.fire(
              this.translate.instant('COMMON.SUCCESS'),
              this.translate.instant('USERS.MESSAGES.UPDATE_SUCCESS'),
              'success'
            );
            this.loadUsers();
          },
          error: (err: any) => {
            Swal.fire(
              this.translate.instant('COMMON.ERROR'),
              err.error?.message || this.translate.instant('COMMON.GENERIC_ERROR'),
              'error'
            );
          }
        });
      }
    });
  }

  onArchive(id: number) {
    Swal.fire({
      title: this.translate.instant('USERS.MESSAGES.ARCHIVE_CONFIRM_TITLE'),
      text: this.translate.instant('USERS.MESSAGES.ARCHIVE_CONFIRM_TEXT'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('USERS.ACTIONS.ARCHIVE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL'),
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {
      if (result.isConfirmed) {
        this.adminService.archiveUser(id).subscribe({
          next: () => {
            Swal.fire(
              this.translate.instant('COMMON.SUCCESS'),
              this.translate.instant('USERS.MESSAGES.ARCHIVE_SUCCESS'),
              'success'
            );
            this.loadUsers();
          },
          error: (err) => {
            Swal.fire(
              this.translate.instant('COMMON.ERROR'),
              err.error?.message || this.translate.instant('COMMON.GENERIC_ERROR'),
              'error'
            );
          }
        });
      }
    });
  }
}
