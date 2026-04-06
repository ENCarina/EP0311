import { Component, OnInit, inject } from '@angular/core'; 
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ConsultationService } from '../shared/consultation.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; 
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-consultation',
  standalone: true, 
  imports: [ReactiveFormsModule, CommonModule, TranslateModule],
  templateUrl: './consultation.component.html',
  styleUrl: './consultation.component.css',
})
export class ConsultationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private consultationService = inject(ConsultationService);
  private router = inject(Router);
  public translate = inject(TranslateService); 

  allConsultations: any[] = [];     
  filteredConsultations: any[] = [];
  selectedStaff: any = null;
 
  addMode = true;
  showModal = false;
 
  consultationForm = this.fb.nonNullable.group({
    id: [null as number | null],
    name: ['', [Validators.required]],
    description: [''], 
    specialty: ['GENERAL', [Validators.required]],
    duration: [60, [Validators.required, Validators.min(5)]],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  ngOnInit() {
    this.getConsultations();
  }

  getConsultations() {
    this.consultationService.getConsultations().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.allConsultations = data;
        this.applyFilter();
      },
      error: (err: any) => {
        console.error('Hiba a betöltéskor:', err);
        Swal.fire(
          this.translate.instant('COMMON.ERROR'),
          this.translate.instant('COMMON.LOADING_ERROR'),
          'error'
        );
      }
    });
  }

  private applyFilter() {
    if (this.selectedStaff?.specialty) {
      this.filteredConsultations = this.allConsultations.filter(c => 
        c.specialty === this.selectedStaff.specialty
      );
    } else {
      this.filteredConsultations = this.allConsultations;
    }
  }

  startShowModal() {
    this.addMode = true;
    this.showModal = true;
    this.consultationForm.reset({
      id: null,
      name: '',
      description: '',
      specialty: 'GENERAL',
      duration: 60,
      price: 0
    });
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
      const { id, ...payload } = data; 
      this.consultationService.createConsultation(payload as any).subscribe({
        next: () => this.handleSuccess(this.translate.instant('SERVICES.MESSAGES.ADD_SUCCESS')),
        error: (err: any) => this.handleError(err)
      });
    } else {
      if (data.id) {
        const { id, ...payload } = data;
        this.consultationService.updateConsultation(id, payload as any).subscribe({
          next: () => this.handleSuccess(this.translate.instant('SERVICES.MESSAGES.UPDATE_SUCCESS')),
          error: (err: any) => this.handleError(err)
        });
      } else {
        Swal.fire(
          this.translate.instant('COMMON.ERROR'),
          this.translate.instant('SERVICES.MESSAGES.MISSING_ID'),
          'error'
        );
      }
    }
  }

  deleteConsultation(id: number) {
    Swal.fire({
      title: this.translate.instant('SERVICES.MESSAGES.DELETE_CONFIRM_TITLE'),
      text: this.translate.instant('SERVICES.MESSAGES.DELETE_CONFIRM_TEXT'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      cancelButtonColor: '#d33',
      confirmButtonText: this.translate.instant('SERVICES.MESSAGES.CONFIRM_DELETE'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result) => {
      if (result.isConfirmed) {
        this.consultationService.deleteConsultation(id).subscribe({
          next: () => {
            this.getConsultations();
            Swal.fire(
              this.translate.instant('COMMON.SUCCESS'),
              this.translate.instant('SERVICES.MESSAGES.DELETE_SUCCESS'),
              'success'
            );
          },
          error: (err: any) => this.handleError(err)
        });
      }
    });
  }

  private handleSuccess(message: string) {
    this.showModal = false;
    this.getConsultations();
    this.consultationForm.reset();
    this.addMode = true;
    Swal.fire({ 
      title: this.translate.instant('COMMON.SUCCESS'), 
      text: message, 
      icon: 'success', 
      timer: 2000, 
      showConfirmButton: false 
    });
  }

  private handleError(err: any) {
    console.error('API hiba:', err);
    Swal.fire(
      this.translate.instant('COMMON.ERROR'), 
      err.error?.message || this.translate.instant('COMMON.GENERIC_ERROR'), 
      'error'
    );
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
