import { Component, inject, OnInit } from '@angular/core';
import { StaffService } from '../shared/staff.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import Swal from 'sweetalert2'
import { AuthService } from '../shared/auth.service';
import { CommonModule } from '@angular/common';
import { BookingService } from '../shared/booking.service';
import { ConsultationService } from '../shared/consultation.service';
import { Router } from '@angular/router';

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

    protected staffs: any[] = [];
    protected selectedStaffId: number | null = null;
    protected allConsultations: any[] = [];
    protected selectedTreatments: number[] = [];
    protected showModal = false;
    protected addMode = true;

    protected staffForm = this.builder.group({
      id:[0],
      name:['', [Validators.required, Validators.minLength(3)]],
      email:['', [Validators.required, Validators.email]],
      password: [''],
      role:['1'],
      specialty:['', Validators.required],
      bio:[''],
      isAvailable:[true], 
      isActive:[true]
    })

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
          // 1. Kérjük le a form nyers adatait
      const rawData = this.staffForm.getRawValue();
      
      // 2. Destrukturálás: Csak azokat vesszük ki, amiket NEM akarunk a 'rest'-be
      const { id, role, password, ...rest } = rawData;

      // 3. Payload összeállítása
      const payload: any = {
        ...rest,
        roleId: Number(role), 
        treatmentIds: this.selectedTreatments // Beküldjük a kijelölt szolgáltatásokat
      };

      // 4. Csak akkor küldjük a jelszót, ha beírtak valamit
      if (password && password.trim() !== '') {
        payload.password = password;
      }

      console.log('Küldendő adatok (Payload):', payload);

      // 5. API hívás
      this.api.addStaff(payload).subscribe({
        next: (res: any) => {
          // Megnézzük, mi jött vissza (id vagy userId)
          const newStaffId = res.data?.id || res.id;

          // Ha a backend store-ja nem mentené el a kezeléseket, itt még egyszer megpróbáljuk
      if (this.selectedTreatments.length > 0 && newStaffId) {
            this.api.assignTreatments(newStaffId, this.selectedTreatments).subscribe({
              next: () => this.completeAction('Szakember és kezelések hozzáadva!'),
              error: () => this.completeAction('Szakember hozzáadva, de a kezelések mentése sikertelen.')
            });
      } else {
          this.completeAction('Szakember sikeresen hozzáadva!');
          }
        },
        error: (err: any) => {
          console.error('Mentési hiba:', err);
          Swal.fire('Hiba', err.error?.message || 'Sikertelen mentés', 'error');
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
      this.staffForm.reset({ id: 0, role: '1', isAvailable: true });
      this.selectedTreatments = [];
      this.getStaffs();
      Swal.fire({ icon: 'success', title: message, timer: 1500, showConfirmButton: false });
    }

    save() {
      if (this.staffForm.invalid) {
        alert('Tölts ki minden kötelező mezőt!');
        //this.staffForm.markAllAsTouched();
        return;
      }
      this.addMode ? this.addStaff() : this.updateStaff();
    }
  
    updateStaff() {
      const staffId = this.selectedStaffId; 
      if (!staffId) {
        Swal.fire('Hiba', 'Nem azonosítható a szakember!', 'error');
        return;
      }

      // 1. Megkeressük az eredeti userId-t a listából
      const currentStaff = this.staffs.find(s => s.id === staffId);
      const userIdFromList = currentStaff?.userId;

      // 2. Kérjük le a form adatait
      const rawData = this.staffForm.getRawValue();

      // 3. Destrukturálás (A 'user'-t kivéve, mert nincs a formban)
      const { id, role, password, ...rest } = rawData;

      // 4. Az objektum összeállítása 
      const updateData: any = { 
        ...rest, 
        userId: userIdFromList, 
        roleId: Number(role),
        treatmentIds: this.selectedTreatments 
      };

      // 5. Jelszó kezelése (Ha van beírva, hozzáadjuk)
      if (password && password.trim() !== '') {
        updateData.password = password;
      }

      // 6. API hívás (az updateData-t küldjük)
      this.api.updateStaff(staffId, updateData).subscribe({
        next: () => {
          // Kezelések frissítése
          this.api.assignTreatments(staffId, this.selectedTreatments).subscribe({
            next: () => this.completeAction('Adatok és kezelések frissítve!'),
            error: (err) => {
              console.error("Kezelések hiba:", err);
              this.completeAction('Adatok frissítve, de a kezelések nem.');
            }
          });
        },
        error: (err: any) => {
          Swal.fire('Hiba', err.error?.message || 'Sikertelen frissítés.', 'error');
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
      const staffId = staff.id;
      const userId = staff.userId || staff.id;
      
      this.api.updateStaff(staff.id, { isActive: true }).subscribe({
      next: () => {
        this.getStaffs();
        Swal.fire('Visszaállítva', 'A szakember újra aktív.', 'success');
      },
      error: (err) => {
          console.error("Visszaállítási hiba (404-es szál):", err);
          if (err.status === 404) {
            // Ha a Staff API nem találja, megpróbáljuk a User-en keresztül "elvarrni"
            Swal.fire({
              title: '404 - Nem található',
              text: 'A Staff rekord nem elérhető. Megpróbáljuk a User szintű visszaállítást?',
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Igen'
            }).then((res) => {
              if (res.isConfirmed) {
                // Ide jöhet az az API hívás, ami a Dashboard-on is visszaállítja (pl. updateStaff helyett archiveUser párja)
                this.api.updateStaff(userId, { isActive: true }).subscribe(() => this.getStaffs());
              }
            });
          }
        }
      });
    }
  }
