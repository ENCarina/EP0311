import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { AuthService } from '../shared/auth.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})

export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  
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
      const confirmPassword = control.get('confirmPassword')?.value;
      
      if (password !== confirmPassword) {
          control.get('confirmPassword')?.setErrors({ mismatch: true });
          return { mismatch: true };
      }
      return null;
    };
  }
  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
      this.isLoading = true;
      const { confirmPassword, ...dataToSend } = this.registerForm.getRawValue();

      this.auth.register(dataToSend).pipe(takeUntilDestroyed()).subscribe({
        next: (res:any) => {
          this.isLoading = false;
          Swal.fire({
            title:'Sikeres regisztráció!', 
            text: 'Üdvözöljük!', 
            icon:'success',
            confirmButtonColor:'#003366'
          }).then(() => { 
            const role = res.data?.roleId;
            this.router.navigate([role === 2 ? '/admin/staff' : '/booking']);
          });
        },
        error: (err:any) => {
          this.isLoading = false;
          Swal.fire('Hiba!', err.error?.message || 'Sikertelen regisztráció!', 'error');
        }
      });
    }
  }


