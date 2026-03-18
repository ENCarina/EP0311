import { Component, OnInit, inject } from '@angular/core'; 
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ConsultationService } from '../shared/consultation.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; 


@Component({
  selector: 'app-consultation',
  standalone: true, 
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.css',
})
export class ConsultationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private consultationService = inject(ConsultationService);
  private router = inject(Router);

  allConsultations: any[] = [];     
  filteredConsultations: any[] = [];
  selectedStaff: any = null;
 
  addMode = true;
  showModal = false;
  consultationForm = this.fb.nonNullable.group({
    id: [null as number | null],
    name: ['', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(3)]], 
    specialty: ['', [Validators.required]],
    duration: [60, [Validators.required, Validators.min(5)]],
    price: [0, [Validators.required, Validators.min(0)]]
});
  ngOnInit() {
    this.getConsultations();
  }
  getConsultations() {
    this.consultationService.getConsultations().subscribe({
      next: (res:any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.allConsultations = data;

        if (this.selectedStaff) {
          this.filterBySpecialty(this.selectedStaff.specialty);
        } else {
          this.filteredConsultations = data;
        }
      },
      error: (err:any) => console.error('Hiba a betöltéskor:', err)
    });
  }
  onStaffSelect(staff: any) {
    this.selectedStaff = staff; 
    this.filterBySpecialty(staff.specialty);
}
 private filterBySpecialty(specialty: string) {
    if (!specialty) {
      this.filteredConsultations = this.allConsultations;
      return;
    }

    this.filteredConsultations = this.allConsultations.filter(c => 
      c.specialty === specialty
    );
}
  startShowModal() {
    this.addMode = true;
    this.showModal = true;
    this.consultationForm.reset();
  }
  startEdit(consultation: any) {
    this.addMode = false;
    this.showModal = true;

    this.consultationForm.patchValue({
      id: consultation.id,
      name: consultation.name,
      description: consultation.description,
      specialty: consultation.specialty,
      duration: Number(consultation.duration),
      price: Number(consultation.price)
    });
  }

  startSave() {
    if (this.consultationForm.invalid) {
      this.consultationForm.markAllAsTouched();
      return;
    }
    const data = this.consultationForm.getRawValue();

    if (this.addMode) {
      this.consultationService.createConsultation(data as any).subscribe({
        next: () => this.handleSuccess('Szolgáltatás hozzáadva!'),
        error: (err:any) => this.handleError(err)
      });
    } else {
      const {id, ...payload} = data;
      if (id) {
        this.consultationService.updateConsultation(id, payload as any).subscribe({
          next: () => this.handleSuccess('Sikeres módosítás!'),
          error: (err:any) => this.handleError(err)
        });
      } else {
        Swal.fire('Hiba!', 'Nincs érvényes azonosító a módosításhoz.', 'error');  
      }
    }
  }

  deleteConsultation(id: number){
    Swal.fire({
      title: 'Biztos törölni szeretnéd?',
      text: "Ez a folyamat nem vonható vissza!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Igen, töröld!',
      cancelButtonText: 'Mégse'
    }).then((result) => {
      if (result.isConfirmed) {
        this.consultationService.deleteConsultation(id).subscribe({
          next: () => {
            this.getConsultations();
            Swal.fire('Törölve!', 'A szolgáltatás eltávolítva.', 'success');
          },
          error: (err:any) => this.handleError(err)
        });
      }
    });
  }

  private handleSuccess(message: string) {
    this.showModal = false;
    this.getConsultations();
    this.consultationForm.reset();
    this.addMode = true;
    Swal.fire({ title: 'Siker!', text: message, icon: 'success', timer: 2000 });
  }

  private handleError(err: any) {
    Swal.fire('Hiba!', err.error?.message || 'A művelet nem sikerült.', 'error');
  }

  cancel() {
    this.showModal = false;
    this.addMode = true;
    this.consultationForm.reset();
  }

  onMakeBooking(consultation: any) {
    this.router.navigate(['/booking', consultation.id]);
  }
}
