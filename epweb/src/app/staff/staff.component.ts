import { Component, inject, OnInit } from '@angular/core';
import { StaffService } from '../shared/staff.service';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import Swal from 'sweetalert2'
import { AuthService } from '../shared/auth.service';
import { CommonModule } from '@angular/common';
import { BookingService } from '../shared/booking.service';

@Component({
  selector: 'app-staff',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.css',
})
export class StaffComponent implements OnInit{
  protected readonly api = inject(StaffService)
  protected readonly builder = inject(FormBuilder)
  public readonly auth = inject(AuthService);
  private readonly bookingApi = inject(BookingService);

  protected staffs: any[] = [];
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
  })

  ngOnInit() {
    this.getStaffs()
  }
  getStaffs() {
    this.api.getStaff().subscribe({
      next: (res:any) => {
        const rawData = res.data || res;
        this.staffs = rawData.map((s: any) => {
          const profile = s.staffProfile || s.user;
          return {
            ...s,
            name: s.staffProfile?.name || s.name || 'Névtelen',
            email: s.staffProfile?.email || s.email || 'Nincs email',
            role: s.staffProfile?.roleId?.toString() || s.role || '1',
          };  
        });
      },
      error: () => Swal.fire('Hiba', 'Nem sikerült betölteni a listát', 'error')
    });
  }
  startEdit(staff: any) {
    this.addMode = false;
    this.showModal = true;
    this.staffForm.patchValue({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      specialty: staff.specialty,
      bio: staff.bio,
      isAvailable: staff.isAvailable
    });
    
    this.staffForm.get('password')?.setValue(''); 
  }

  
  completeAction(message: string) {
    this.showModal = false;
    this.staffForm.reset({ id: 0, role: '1', isAvailable: true });
    this.getStaffs();
    Swal.fire({ icon: 'success', title: message, timer: 1500, showConfirmButton: false });
  }

  save() {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }
    this.addMode ? this.addStaff() : this.updateStaff();
  }
  viewBookings(staffId: number) {
    this.bookingApi.getAvailableSlots(staffId, 0, '').subscribe({
      next: (res: any) => {
      const slots = res.data || res;
      }
      
    });
  }
  startshowModal() {
    this.addMode = true;
    this.staffForm.reset({ role: '1', isAvailable: true });
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false; 
    this.staffForm.reset();
  }
 
  addStaff() {
    this.api.addStaff(this.staffForm.getRawValue()).subscribe({
      next: (res:any) => this.completeAction('Szakember hozzáadva!'),
      error: (err:any) => Swal.fire('Hiba', err.error?.message || 'Sikertelen mentés', 'error')
        });
  }
  updateStaff() {
    const rawData = this.staffForm.getRawValue();
    const id = Number (rawData.id);

    const updateData: any = { ...rawData };
    delete updateData.id;

  if (!updateData.password || updateData.password.trim() === '') {
    delete updateData.password;
  }

  this.api.updateStaff(id, updateData).subscribe({
    next: () => this.completeAction('Adatok frissítve'),
    error: (err: any) => Swal.fire('Hiba', err.error?.message ||'Sikertelen frissítés.')
      });
  }
  
  deleteStaff(id: number) {
    Swal.fire({
      title: 'Biztosan törlöd?',
      text: "Ez a művelet nem visszavonható!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Igen, törlés!',
      cancelButtonText: 'Mégse'
    }).then((result) => {
      if (result.isConfirmed) {
        this.api.deleteStaff(id).subscribe({
          next: () => {
            this.getStaffs();
            Swal.fire('Törölve!','A szakember eltávolítva.', 'success');
          },
          error: (err) => Swal.fire('Hiba', err.error?.message || 'Sikertelen törlés.', 'error')  
        });
      } 
    });
  }
}
