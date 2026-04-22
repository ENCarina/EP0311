import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  onStartBooking() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/booking']);
    } else {
      Swal.fire({
        title: this.translate.instant('HOME.SWAL.TITLE'),
        text: this.translate.instant('HOME.SWAL.TEXT'),
        icon: 'info',
        confirmButtonColor: '#007bff',
        confirmButtonText: this.translate.instant('HOME.SWAL.BTN'),
        heightAuto: false 
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/login']);
        }
      });
    }
  }
}
