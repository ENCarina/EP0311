import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';


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
  public currentUserName = signal<string>('Felhasználó');  
  constructor() {
    this.loadStorage(); 
  }
  private loadStorage() {
    if (this.isBrowser) {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('roleId');
      const userId = localStorage.getItem('userId');
      const userName = localStorage.getItem('userName');

      this._isAuthenticated.set(!!token);

      if (role) this.currentUserRole.set(Number(role));
      if (userId) this.currentUserId.set(Number(userId)); 
      if (userName) this.currentUserName.set(userName);
  }
}
  login (user:any) {
    const url = this.host + 'login'
    return this.http.post(url, user).pipe(
      tap((response: any) => {
        console.log('Login válasz:', response);
        
        const token = response.accessToken || response.token;
        const userId = response.id || (response.user ? response.user.id : null) || (response.data ? response.data.id : null);
        const roleId = response.roleId !== undefined ? response.roleId : (response.user ? response.user.roleId : null);      
        
        const name = response.name || response.userName || response.user?.name || 'Felhasználó';

        if (this.isBrowser && token) {
          localStorage.setItem('token', token);
          localStorage.setItem('userName', name);
        
        const userObj = { id: userId, roleId: roleId, name: name || response.userName };
          localStorage.setItem('user', JSON.stringify(userObj));
        
        if (userId) {
          localStorage.setItem('userId', userId.toString());
          this.currentUserId.set(Number(userId));
        }
        
       if (roleId !== null && roleId !== undefined) {
          localStorage.setItem('roleId', roleId.toString());
          this.currentUserRole.set(Number(roleId));
        }
        this.currentUserName.set(name); 
        this._isAuthenticated.set(true);
        }
      })
    );
  }
  getUserName(): string {
    const userJson = localStorage.getItem('user');
    if (this.isBrowser) {
      return this.currentUserName();
    }
    return 'Betöltés...';
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
    this.currentUserId.set(null);
    this.currentUserName.set('Felhasználó');
    this.router.navigate(['/login']);
  }
  getUserId(): number | null {
  if (this.currentUserId()) return this.currentUserId();
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    return user.id || user.userId || null;
  } catch (e) {
    return null;
  }
}

  getRoleId(): number {
    const role = this.currentUserRole();
    return role !== null ? role : 0; 
    } 
  
  register(user: any) {
    const url = `${this.host}register`;

    return this.http.post(url, user).pipe(
      tap((response: any) => {
        const token = response.token || response.accessToken;
          if (this.isBrowser && response.success && token) {
            localStorage.setItem('token', token);
            this._isAuthenticated.set(true);

            const roleId = response.data?.roleId || response.roleId;
            const userId = response.data?.id || response.id;
            const name = response.data?.name || response.name || 'Új Felhasználó';

          if (roleId !== undefined) {
            localStorage.setItem('roleId', roleId.toString());
            this.currentUserRole.set(Number(roleId));
          }
          if (userId) {
            localStorage.setItem('userId', userId.toString());
            this.currentUserId.set(Number(userId));
          }
          this.currentUserName.set(name);
          localStorage.setItem('userName', name);
        }
      })
    );
  }
    // Elfelejtett jelszó kérelem elküldése
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.host}forgot-password`, { email });
  }

  // Új jelszó mentése a kapott tokennel
   
  resetPassword(token: string, passwords: any): Observable<any> {
    // A passwords objektum tartalmazza: password, confirmPassword
    return this.http.post(`${this.host}reset-password/${token}`, passwords);
  }
      
  sendVerificationToken(token: string) {
    return this.http.get(`${this.host}verify-email/${token}`);
  }
}
