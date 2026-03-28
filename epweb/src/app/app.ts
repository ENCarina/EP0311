import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './shared/auth.service';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  public readonly auth = inject(AuthService);
  protected readonly title = signal('epweb');
  isBookingPage = signal(false);

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      const isSpecialPage = url.startsWith('booking') || url.startsWith('login');
      
      this.isBookingPage.set(isSpecialPage);
    });
  }
}
