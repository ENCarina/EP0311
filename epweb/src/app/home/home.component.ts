import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  constructor(
    public authService: AuthService, // bejelentkezési állapotot
    private router: Router,
    private translate: TranslateService
  ) {}

  onStartBooking() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/booking']);
    } else {
      Swal.fire({
      title: this.translate.instant('HOME.SWAL.TITLE'),
      text: this.translate.instant('HOME.SWAL.TEXT'),
      icon: 'info',
      confirmButtonText: this.translate.instant('HOME.SWAL.BTN')
    }).then(() => {
      this.router.navigate(['/login']);
    });
  }
}
}
