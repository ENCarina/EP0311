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

@Component({
  selector: 'app-staff',
  imports: [ReactiveFormsModule, CommonModule],
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
          console.error('Nem sikerult a kinevezheto felhasznalok betoltese:', err);
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
              name: profile.name || s.name || 'Névtelen',
              email: profile.email || s.email || 'Nincs email',
              role: profile.roleId?.toString() || s.roleId?.toString() || s.role?.toString() || '1',
              isActive: s.isActive ?? true,
              isAvailable: s.isAvailable ?? true
            };  
        }),
        console.log('Leképezett staff lista:', this.staffs);
      },
        error: (err) => {
        console.error("HTTP Hiba:", err); 
        Swal.fire('Hiba', 'Nem sikerült betölteni a listát!', 'error');
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
          error:(err:any) => console.warn("Kezelések betöltése sikertelen.", err)
          });
        }

    addStaff() {
      const selectedUserId = Number(this.staffForm.get('userId')?.value);
      const specialty = String(this.staffForm.get('specialty')?.value || '').trim();

      if (!selectedUserId) {
        Swal.fire('Hiba', 'Válassz egy regisztrált felhasználót!', 'error');
        return;
      }

      if (!specialty) {
        Swal.fire('Hiba', 'A szakterület megadása kötelező.', 'error');
        return;
      }

      this.api.promoteUser(selectedUserId, { specialty, treatmentIds: this.selectedTreatments }).subscribe({
        next: () => {
          this.completeAction('Szakember sikeresen létrehozva!');
        },
        error: (err: any) => {
          console.error('Kinevezési hiba:', err);
          Swal.fire('Hiba', err.error?.message || 'Sikertelen kinevezés', 'error');
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
        alert('Tölts ki minden kötelező mezőt!');
        return;
      }
      this.addMode ? this.addStaff() : this.updateStaff();
    }
  
    updateStaff() {
      const staffId = this.selectedStaffId; // Ez a Staff tábla ID-ja (pl. 6)
      if (!staffId) {
        Swal.fire('Hiba', 'Nem azonosítható a szakember!', 'error');
        return;
      }
      // 1. Megkeressük a valódi USER ID-t
      const currentStaff = this.staffs.find(s => s.id === staffId);
      const targetUserId = currentStaff?.userId; 

      if (!targetUserId) {
        Swal.fire('Hiba', 'A felhasználói azonosító hiányzik!', 'error');
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
          this.completeAction('Sikeres mentés: Adatok és kezelések frissítve!');
          this.getStaffs(); // Lista frissítése
        },
        error: (err) => {
          console.error("Kezelések hiba:", err);
          this.completeAction('Adatok frissítve, de a kezelések mentése sikertelen (404).');
        }
      });
    },
    error: (err: any) => {
      console.error("Frissítési hiba:", err);
      Swal.fire('Hiba', err.error?.message || 'Sikertelen frissítés.', 'error');
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
        title: 'Biztosan inaktiválod?',
        text: "Az orvos nem fog megjelenni a pácienseknek, de az adatai megmaradnak az archívumban.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Igen, inaktiváld!',
        cancelButtonText: 'Mégse'
      }).then((result) => {
        if (result.isConfirmed) {
          this.api.archiveUser(targetUserId).subscribe({
            next: () => {
              this.getStaffs();
              Swal.fire('Inaktiválva!','A szakember eltávolítva.', 'success');
            },
            error: (err) => Swal.fire('Hiba', err.error?.message || 'Sikertelen művelet.', 'error')  
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
            title: 'Sikeres visszaállítás',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error("Hiba:", err);
          Swal.fire('Hiba', 'A szerver elutasította a kérést. Ellenőrizd a jogosultságokat!', 'error');
        }
      });
    }
  }