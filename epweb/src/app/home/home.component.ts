import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../shared/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  onStartBooking() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/booking']);
    } else {
      Swal.fire({
      title: 'Bejelentkezés szükséges',
      text: 'A foglaláshoz kérjük, jelentkezzen be!',
      icon: 'info',
      confirmButtonText: 'Belépés'
    }).then(() => {
      this.router.navigate(['/login']);
    });
  }
}

}
