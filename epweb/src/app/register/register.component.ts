import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../shared/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, TranslateModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})

export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  
  isLoading = false;
  errorMessage = '';

  registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
    }, { 
    validators: [this.createCompareValidator()]
   });

  get f() { return this.registerForm.controls; }
  private createCompareValidator(): ValidatorFn{ 
    return (control: AbstractControl) => {
      const password = control.get('password')?.value;
      const confirm = control.get('confirmPassword')?.value;
      
      const confirmControl = control.get('confirmPassword');

      if (!password || !confirm) return null;

      if (password !== confirm) {
          confirmControl?.setErrors({ ...confirmControl.errors, mismatch: true });
          return { mismatch: true };
      }else {
      if (confirmControl?.hasError('mismatch')) {
          const remainingErrors = { ...confirmControl.errors };
          delete remainingErrors['mismatch'];
          const finalErrors = Object.keys(remainingErrors).length ? remainingErrors : null;
          confirmControl.setErrors(finalErrors);
        }
        return null;
      }
    }
  }
  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
      this.isLoading = true;
      const rawValues = this.registerForm.getRawValue();
      
      const payload = {
      name: rawValues.name,
      email: rawValues.email,
      password: rawValues.password,
      confirmPassword: rawValues.confirmPassword 
      };

      this.auth.register(payload).subscribe({
        next: (res:any) => {
          this.isLoading = false;
          Swal.fire({
            title: this.translate.instant('REGISTER.SWAL.SUCCESS_TITLE'),
            text: this.translate.instant('REGISTER.SWAL.SUCCESS_TEXT'), 
            icon:'success',
            confirmButtonColor:'#003366'
          }).then(() => { 
            const role = res.data?.roleId;
            this.router.navigate([role === 2 ? '/admin/staff' : '/booking']);
          });
        },
        error: (err:any) => {
          this.isLoading = false;
          const errorMsg = err.error?.message || this.translate.instant('REGISTER.SWAL.ERROR_DEFAULT');
          Swal.fire(this.translate.instant('REGISTER.SWAL.ERROR_TITLE'), errorMsg, 'error');
        }
      });
    }
  }


