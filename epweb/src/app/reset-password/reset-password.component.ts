import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  token: string | null = null;
  errorMessage: string = '';
  isLoading: boolean = false;

  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator 
  });

  get f() { return this.resetForm.controls; }

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    
    if (!this.token) {
      this.errorMessage = this.translate.instant('FORGOT_PASSWORD.MESSAGES.ERROR');
    }
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }
 
  onSubmit() {
    if (this.resetForm.valid && this.token) {
      this.isLoading = true;
      this.errorMessage = '';

      const passwordData = {
        password: this.resetForm.value.password,
        password_confirmation: this.resetForm.value.confirmPassword,
        lang: this.translate.currentLang || 'en'
      };;

      this.authService.resetPassword(this.token, passwordData).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/login'], { queryParams: { resetSuccess: true } });
        },
        error: (err:any) => {
          this.isLoading = false;
          const serverKey = err.error?.message || 'MESSAGES.AUTH.ERROR_GENERAL';
          this.errorMessage = this.translate.instant(serverKey);
        }
      });
    } else {
      this.resetForm.markAllAsTouched();
    }
  }
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
