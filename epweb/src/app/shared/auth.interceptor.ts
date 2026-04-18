import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router'; 
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const authService = inject(AuthService);

  let authReq = req;

  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('token');

    const lang = localStorage.getItem('lang') || 'en';

    let headers = req.headers.set('Accept-Language', lang);

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    authReq = req.clone({ headers }); 
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('login')) {
          authService.logout();
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url }
        });
      }
      return throwError(() => error);
    })
  );
};