import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../shared/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit{
  private route = inject (ActivatedRoute);
  private router = inject (Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  token: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: (group) => group.get('password')?.value === group.get('confirmPassword')?.value ? null : { notSame: true }
  });

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    //this.token = this.route.snapshot.params['token'];
    console.log('--- RESET PASSWORD DEBUG ---');
    console.log('Teljes URL:', window.location.href);
    console.log('Kinyert token:', this.token);
    
    if (!this.token) {
      this.errorMessage = 'Hiányzó vagy érvénytelen visszaállító kulcs!';
      console.error('Hiba: Nem található token az URL-ben.');
    }
  }
  onSubmit() {
    if (this.resetForm.valid && this.token) {
      this.isLoading = true;

      const resetData = {
        token: this.token,
        password: this.resetForm.get('password')?.value
      };
      this.authService.resetPassword(this.token, this.resetForm.value).subscribe({
        next: (response) => {
          alert('Sikeres jelszó módosítás!');
          this.router.navigate(['/login'], { queryParams: { resetSuccess: true } });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Szerver hiba:', err);
          this.errorMessage = err.error.message || 'A jelszó visszaállítása sikertelen.';
        }
      });
    }
  }
}
