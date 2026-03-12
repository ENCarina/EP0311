import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './shared/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const loggedIn = authService.isAuthenticated();

  const isAdmin = authService.currentUserRole() === 2;

  // 1. User nincs belépve, akkor login
  if (!loggedIn) {
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
    return false;
  }
  // 2. Admin, mehet mindenre is
  if (state.url.startsWith('/admin')) {
    if (isAdmin) {
      return true;
    } else {
      router.navigate(['/booking']); 
      return false;
    }
  }
  // 3. Minden más esetben (pl. /booking), ha be van lépve, go!
  return true;
};
 
