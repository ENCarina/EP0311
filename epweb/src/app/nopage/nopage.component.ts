import { Component, inject, OnInit, OnDestroy } from '@angular/core'; 
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-nopage',
  standalone: true, 
  imports: [RouterLink, TranslateModule],
  templateUrl: './nopage.component.html',
  styleUrl: './nopage.component.css',
})
export class NopageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private timeoutId: any; 

  ngOnInit(): void {
    this.timeoutId = setTimeout(() => {
      this.router.navigate(['/home']);
    }, 8000);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

