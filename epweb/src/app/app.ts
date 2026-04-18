import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './shared/auth.service';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, TranslateModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  public readonly auth = inject(AuthService);
  public readonly translate = inject(TranslateService);
  
  protected readonly title = signal('epweb');
  protected isBookingPage = signal(false);

  public isAdminMenuOpen = signal(false);
 
  constructor() {
     this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      const isSpecialPage = url.includes('booking') || url.includes('login');
      this.isBookingPage.set(isSpecialPage);

      this.isAdminMenuOpen.set(false);
    });
  }
  
  ngOnInit(): void {
    this.initializeLanguage(); 
  }
  private initializeLanguage(): void {
    this.translate.addLangs(['en', 'hu']);
    const savedLang = localStorage.getItem('lang') || 'en';
    this.translate.use(savedLang);
  }
  switchLanguage(lang: string): void {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
  }

  toggleAdminMenu(event: Event): void {
    event.stopPropagation();
    this.isAdminMenuOpen.update(open => !open);
  }

  @HostListener('document:click')
  closeMenus(): void {
    if (this.isAdminMenuOpen()) {
      this.isAdminMenuOpen.set(false);
    }
  }
} 
 
