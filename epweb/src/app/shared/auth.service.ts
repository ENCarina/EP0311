import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
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
  
  public currentUserRole = signal<number | null>(null);
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

  getUserName(): string {
    return this.currentUserName();
  }

  getUserId(): number | null {
    return this.currentUserId();
  }

  getRoleId(): number {
    const role = this.currentUserRole();
    return role !== null ? role : 0;
  }

  login(user: any) {
    return this.http.post(`${this.host}login`, user).pipe(
      tap((response: any) => {
        const token = response.accessToken || response.token;
        const userId = response.id || response.user?.id || response.data?.id;
        const roleId = response.roleId ?? response.user?.roleId;
        const name = response.name || response.userName || response.user?.name || 'Felhasználó';

        if (this.isBrowser && token) {
          this.saveUserData(token, userId, roleId, name);
        }
      })
    );
  }

  register(user: any) {
    return this.http.post(`${this.host}register`, user).pipe(
      tap((response: any) => {
        const token = response.accessToken || response.token;
        const userId = response.id || response.user?.id || response.data?.id;
        const roleId = response.roleId ?? response.user?.roleId;
        const name = response.name || response.userName || response.user?.name || 'User';

        if (this.isBrowser && token) {
          this.saveUserData(token, userId, roleId, name);
        }
      })
    );
  }

  private saveUserData(token: string, userId: any, roleId: any, name: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('userName', name);
    if (userId) localStorage.setItem('userId', userId.toString());
    if (roleId !== undefined && roleId !== null) localStorage.setItem('roleId', roleId.toString());
    
    this.currentUserId.set(Number(userId));
    this.currentUserRole.set(Number(roleId));
    this.currentUserName.set(name); 
    this._isAuthenticated.set(true);
  }

  logout() {
    if (this.isBrowser) {
      localStorage.clear();
    }
    this._isAuthenticated.set(false);
    this.currentUserRole.set(null);
    this.currentUserId.set(null);
    this.currentUserName.set('User');
    this.router.navigate(['/login']);
  }

  forgotPassword(data:any): Observable<any> {
    return this.http.post(`${this.host}forgot-password`, data);
  }

  resetPassword(token: string, data: any): Observable<any> {
    const payload = {
      token: token,
      password: data.password,
      password_confirmation: data.password_confirmation,
      lang: data.lang || 'en'
    };
    return this.http.post(`${this.host}reset-password`, payload);
  }

  sendVerificationToken(token: string) {
    return this.http.get(`${this.host}verify-email/${token}`);
  }

  hasRole(requiredRole: number): boolean {
    const role = this.currentUserRole();
    return role !== null && role >= requiredRole;
  }
}