import { Component, inject, signal } from '@angular/core';
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
export class App {
  private readonly router = inject(Router);
  public readonly auth = inject(AuthService);
  public readonly translate = inject(TranslateService);

  protected readonly title = signal('epweb');
  isBookingPage = signal(false);

  constructor() {
    // --- NYELVI BEÁLLÍTÁSOK ---
    this.translate.addLangs(['hu', 'en']);
    this.translate.use('hu'); 

    // --- ROUTER FIGYELÉS ---
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe((event: NavigationEnd) => {
      const url = event.urlAfterRedirects;
      const isSpecialPage = url.includes('booking') || url.includes('login');
      
      this.isBookingPage.set(isSpecialPage);
    });
  }
    switchLanguage(lang: string) {
      console.log('Nyelvváltás ide:', lang); 
      this.translate.use(lang).subscribe(() => {
        console.log('Sikeres váltás a következőre:', this.translate.currentLang);
      });
    }
  }
