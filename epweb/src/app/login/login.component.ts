import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, RouterLink} from '@angular/router'; 
import { AuthService } from '../shared/auth.service';
import Swal from 'sweetalert2'
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, RouterLink, TranslateModule], 
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})

export class LoginComponent implements OnInit {

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  isLoading = false;
  errorMessage = '';
  
  loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
  }); 
  
  ngOnInit() {}

  get f() { return this.loginForm.controls; }  

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); 
      this.errorMessage = this.translate.instant('AUTH.VALIDATION_ERROR');
      Swal.fire({
        title: this.translate.instant('COMMON.WARNING'),
        text: this.errorMessage,
        icon: 'warning',
        confirmButtonText: this.translate.instant('COMMON.OK')
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginPayload = {
      ...this.loginForm.getRawValue(),
      lang: this.translate.currentLang || 'hu'
    };

    this.auth.login(loginPayload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.accessToken) {
          localStorage.setItem('token', res.accessToken);
          localStorage.setItem('user', JSON.stringify(res.user)); 
        }
        this.loginForm.reset(); 
        this.cleanupModal();

        const role = Number(res.roleId || res.user?.roleId);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/booking';
        const staffId = this.route.snapshot.queryParams['staffId'];

        if (role === 2 || role === 1) {
          this.router.navigate(['/admin/staff']).then(() => {
            this.isLoading = false; 
          });
        } else {
          this.router.navigate([returnUrl], {
            queryParams: staffId ? { staffId: staffId } : {},
            queryParamsHandling: 'merge' 
          }).then(() => {
            this.isLoading = false;
          });
        }
      }, 
      error: (err: any) => {
        this.isLoading = false;
       // DINAMIKUS HIBAÜZENETEK KEZELÉSE
        const serverKey = err.error?.message;

        if (serverKey && serverKey.startsWith('AUTH.')) {
          this.errorMessage = this.translate.instant(serverKey);
        } else {
          // Tartalék terv, ha a szerver nem küld specifikus kulcsot
          this.errorMessage = this.translate.instant('AUTH.ERROR_GENERAL');
        }

        Swal.fire(
          this.translate.instant('COMMON.ERROR'), 
          this.errorMessage, 
          'error'
        );
      }
    }); 
  }

  private cleanupModal() {
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';

    const backdrops = document.getElementsByClassName('modal-backdrop');
    while (backdrops.length > 0) {
      backdrops[0].parentNode?.removeChild(backdrops[0]);
    }

    const modal = document.querySelector('.modal.show') as HTMLElement;
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  }
}