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

    const lang = localStorage.getItem('lang') || 'hu';

    const headers: any = {
      'Accept-Language': lang
    };

    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('login')) {
        if (isPlatformBrowser(platformId)) {
          authService.logout();;
        }
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};