import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  public translate = inject(TranslateService);
  
  email: string = '';
  isLoading: boolean = false;
  message: string = '';
  isError: boolean = false;

  sendEmail() {
    this.isLoading = true;
    this.message = '';
    const currentLang = this.translate.currentLang || 'hu';
    
    this.authService.forgotPassword({ email: this.email, lang: currentLang }).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.isError = false;
        this.message = this.translate.instant('FORGOT_PASSWORD.MESSAGES.SUCCESS');
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;

        const backendMessage = err.error?.message;

        if (backendMessage) {
          this.message = this.translate.instant(backendMessage);
        } else {
          this.message = this.translate.instant('FORGOT_PASSWORD.MESSAGES.ERROR');
        }
      }
    });
  }
}
