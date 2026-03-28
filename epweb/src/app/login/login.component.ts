import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule, RouterLink} from '@angular/router'; 
import { AuthService } from '../shared/auth.service';
import Swal from 'sweetalert2'
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, RouterLink], 
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isLoading = false;
  errorMessage = '';
 
  loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
  }); 
  
  get f() { return this.loginForm.controls; }  
  login() {
  if (this.loginForm.invalid) {
    this.loginForm.markAllAsTouched(); 
    this.errorMessage = 'Kérjük, töltse ki megfelelően a mezőket!';
    return;
  }
  this.isLoading = true;
  this.errorMessage = '';
  const loginPayload = this.loginForm.getRawValue();

  this.auth.login(loginPayload).subscribe({
    next: (res: any) => {
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
      
      if (err.status === 401 && err.error?.message?.includes('verified')) {
        this.errorMessage = 'Kérjük, igazolja vissza email címét a belépéshez!';
      } else if (err.status === 401) {
        this.errorMessage = 'Hibás email vagy jelszó!';
      } else {
        this.errorMessage = err.error?.message || 'Sikertelen bejelentkezés!';
      }
      Swal.fire('Hiba!', this.errorMessage, 'error');
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