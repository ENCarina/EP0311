import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  
  email: string = '';
  isLoading: boolean = false;
  message: string = '';
  isError: boolean = false;

  sendEmail() {
    this.isLoading = true;
    this.message = '';
    
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isError = false;
        this.message = this.translate.instant('FORGOT_PASSWORD.MESSAGES.SUCCESS');
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.error.message || this.translate.instant('FORGOT_PASSWORD.MESSAGES.ERROR');
      }
    });
  }
}
