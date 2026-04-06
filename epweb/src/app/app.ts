import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './shared/auth.service';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, TranslateModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  public readonly auth = inject(AuthService);
  private readonly translate = inject(TranslateService);
  protected readonly title = signal('epweb');
  isBookingPage = signal(false);
  protected readonly currentLang = signal(localStorage.getItem('lang') || 'hu');

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

  ngOnInit(): void {
    this.translate.addLangs(['hu', 'en']);
    this.translate.use(this.currentLang());
  }

  protected switchLanguage(lang: 'hu' | 'en'): void {
    this.currentLang.set(lang);
    localStorage.setItem('lang', lang);
    this.translate.use(lang);
  }
}
