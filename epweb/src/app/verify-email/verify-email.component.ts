import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../shared/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit {
  private readonly auth = inject(AuthService)
  private readonly route = inject(ActivatedRoute)
  private readonly router = inject(Router)
  private readonly translate = inject(TranslateService);
 
  loading = true
  success = false
  error = false
  
  ngOnInit() {
    //Token kinyerése az URL-ből
    const token = this.route.snapshot.paramMap.get('token')
    if (token) {
      //Küldés a backend-nek
      this.auth.sendVerificationToken(token).subscribe({
        next: (res:any) => {
          this.loading = false
          this.success = true
          console.log('VERIFY_EMAIL.LOG.SUCCESS', res.message);
        },
        error: (err:any) => {
          this.loading = false
          this.error = true
          console.error('VERIFY_EMAIL.LOG.ERROR', err.error?.message);
        }
      });
    } else {
      this.loading = false;
      this.error = true;
    }
  }
}

 

