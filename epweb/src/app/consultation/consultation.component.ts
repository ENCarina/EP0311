import { Component, OnInit, inject } from '@angular/core'; 
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ConsultationService } from '../shared/consultation.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2'; 

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
  private translate = inject(TranslateService);

  allConsultations: any[] = [];     
  filteredConsultations: any[] = [];
  selectedStaff: any = null;
 
  addMode = true;
  showModal = false;

  // Form összeállítása
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
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        this.allConsultations = data;
        this.applyFilter();
      },
      error: (err: any) => console.error(this.translate.instant('CONSULTATION.LOAD_ERROR'), err)
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
      specialty: '',
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
      // --- ÚJ FELVÉTEL ---
      const { id, ...payload } = data; // Újnál nem küldünk ID-t (vagy null-t)
      this.consultationService.createConsultation(payload as any).subscribe({
        next: () => this.handleSuccess(this.translate.instant('CONSULTATION.ADD_SUCCESS')),
        error: (err: any) => this.handleError(err)
      });
    } else {
      // --- MÓDOSÍTÁS ---
      if (data.id) {
        const { id, ...payload } = data;
        this.consultationService.updateConsultation(id, payload as any).subscribe({
          next: () => this.handleSuccess(this.translate.instant('CONSULTATION.UPDATE_SUCCESS')),
          error: (err: any) => this.handleError(err)
        });
      } else {
        Swal.fire(this.translate.instant('COMMON.ERROR'), this.translate.instant('CONSULTATION.MISSING_ID'), 'error');
      }
    }
  }

  deleteConsultation(id: number) {
    Swal.fire({
      title: this.translate.instant('CONSULTATION.DELETE_CONFIRM_TITLE'),
      text: this.translate.instant('CONSULTATION.DELETE_CONFIRM_TEXT'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#003366',
      cancelButtonColor: '#d33',
      confirmButtonText: this.translate.instant('CONSULTATION.DELETE_CONFIRM_BTN'),
      cancelButtonText: this.translate.instant('COMMON.CANCEL')
    }).then((result) => {
      if (result.isConfirmed) {
        this.consultationService.deleteConsultation(id).subscribe({
          next: () => {
            this.getConsultations();
            Swal.fire(this.translate.instant('CONSULTATION.DELETED_TITLE'), this.translate.instant('CONSULTATION.DELETED_TEXT'), 'success');
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
    Swal.fire({ title: this.translate.instant('CONSULTATION.SUCCESS_TITLE'), text: message, icon: 'success', timer: 2000, showConfirmButton: false });
  }

  private handleError(err: any) {
    console.error(this.translate.instant('CONSULTATION.API_ERROR'), err);
    Swal.fire(this.translate.instant('COMMON.ERROR'), err.error?.message || this.translate.instant('CONSULTATION.ACTION_FAILED'), 'error');
  }

  protected translateSpecialty(specialty: string | null | undefined): string {
    if (!specialty) {
      return this.translate.instant('CONSULTATION.GENERAL');
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

  private toTranslationKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
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
