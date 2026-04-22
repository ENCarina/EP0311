import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, RouterLink} from '@angular/router'; 
import { AuthService } from '../shared/auth.service';
import Swal from 'sweetalert2'
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

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
      email: ['', [
        Validators.required, 
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
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
      lang: this.translate.currentLang || 'en'
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
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
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
       
        const serverKey = err.error?.message;

        if (serverKey) {
          const translated = this.translate.instant(serverKey);
          
          this.errorMessage = (translated !== serverKey)
          ? translated 
          : this.translate.instant('MESSAGES.AUTH.ERROR_GENERAL');
        } else {
          this.errorMessage = this.translate.instant('MESSAGES.AUTH.ERROR_GENERAL');
        }

        Swal.fire({
          title: this.translate.instant('COMMON.ERROR.TITLE'), 
          text: this.errorMessage, 
          icon: 'error',
          confirmButtonColor: '#007bff',
          confirmButtonText: this.translate.instant('COMMON.OK')
      });
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