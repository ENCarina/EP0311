import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly host = 'http://localhost:8000/api/';
  private isBrowser: boolean = isPlatformBrowser(this.platformId);

  private _isAuthenticated = signal(false);
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  
  public currentUserRole = signal<number | null>(null);// Szerepkör tárolása signalban (0: Páciens, 1: Orvos, 2: Admin)
  public currentUserId = signal<number | null>(null);   
  constructor() {
    this.loadStorage(); 
  }
  private loadStorage() {
    if (this.isBrowser) {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('roleId');
      const userId = localStorage.getItem('userId');

      this._isAuthenticated.set(!!token);

      if (role) {
        this.currentUserRole.set(Number(role));
      }
      if (userId) {
        this.currentUserId.set(Number(userId)); 
      }
    }
  }
  login (user:any) {
    const url = this.host + 'login'
    return this.http.post(url, user).pipe(
      tap((response: any) => {
        const token = response.accessToken || response.token;
        const userId = response.id || (response.user ? response.user.id : null) || (response.data ? response.data.id : null);
        const roleId = response.roleId !== undefined ? response.roleId : (response.user ? response.user.roleId : null);      

        if (this.isBrowser && token) {
          localStorage.setItem('token', token);
        
        const userObj = {
          id: userId,
          roleId: roleId,
          name: response.name || response.userName || 'Felhasználó'
        };
          localStorage.setItem('user', JSON.stringify(userObj));
        if (userId) {
          localStorage.setItem('userId', userId.toString());
          this.currentUserId.set(Number(userId));
        }
        
       if (roleId !== null && roleId !== undefined) {
          localStorage.setItem('roleId', roleId.toString());
          this.currentUserRole.set(Number(roleId));
        }
        
        localStorage.setItem('userName', userObj.name);
        this._isAuthenticated.set(true);
        }
      })
    );
  }
  hasRole(requiredRole: number): boolean {
    const role = this.currentUserRole();
    return role !== null && role >= requiredRole;
  }
  logout() {
    if (this.isBrowser) {
      localStorage.clear();
    }
    this._isAuthenticated.set(false);
    this.currentUserRole.set(null);
    this
    this.router.navigate(['/login']);
  }
  getUserId(): number | null {
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    // Kezeljük, ha a backend 'id' vagy 'userId' néven küldi
    return user.id || user.userId || null;
  } catch (e) {
    return null;
  }
}

  getRoleId(): number {
    const role = this.currentUserRole();
    return role !== null ? role : 0; 
    } 
  getUserName(): string {
    const userJson = localStorage.getItem('user');
    if (this.isBrowser) {
      return localStorage.getItem('userName') || 'Nincs bejelentkezve';
    }
    return 'Betöltés...';
  }
  register(user: any) {
    const url = this.host + 'register';
    return this.http.post(url, user).pipe(
      tap((response: any) => {
        if (this.isBrowser && response.success && response.token) {
          localStorage.setItem('token', response.token);

          if (response.data?.roleId !== undefined) {
            localStorage.setItem('roleId', response.data.roleId.toString());
            this.currentUserRole.set(response.data.roleId);
          }
          this._isAuthenticated.set(true);
        }
      })
    );
  }
  sendVerificationToken(token: string) {
    const url = this.host + '/verify-email/' + token
    return this.http.get(url)
  }
}

