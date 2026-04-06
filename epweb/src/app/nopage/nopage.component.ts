import { Component, inject, OnInit,  } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-nopage',
  imports: [RouterLink, TranslateModule],
  templateUrl: './nopage.component.html',
  styleUrl: './nopage.component.css',
})
export class NopageComponent implements OnInit {
  private router = inject(Router);
  ngOnInit(): void {
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 8000);
  }
}

