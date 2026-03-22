import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './shared/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const loggedIn = authService.isAuthenticated();
  const userRole = authService.currentUserRole()


  // 1. User nincs belépve, akkor login
  if (!loggedIn) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
  // 2. Admin, mehet mindenre is
  if (state.url.startsWith('/admin')) {
    if (userRole === 2) {
      return true;
    } else {
      router.navigate(['/booking']); 
      return false;
    }
  }

  if (state.url.startsWith('/dashboard')) {
    if (userRole === 1 || userRole === 2) {
      return true;
    } else {
      router.navigate(['/my-bookings']);
      return false;
    }
  }
  // Minden más (pl. /booking, /my-bookings, /profile) -> Mehet!
  return true;
};

