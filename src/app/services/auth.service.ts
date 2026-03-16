import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { APP_CONFIG } from '../config';
import { User, LoginResponse, RegisterResponse } from '../models/auth.model';
import { AuthStore } from '../stores/auth.store';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.config.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(data => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
          }
        })
      );
  }

  register(email: string, username: string, password: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.config.apiUrl}/auth/register`, { 
      email, 
      username, 
      password 
    }).pipe(
      tap(data => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
        }
      })
    );
  }

  fetchProfile(): Observable<User> {
    return this.http.get<User>(`${this.config.apiUrl}/auth/profile`);
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    this.authStore.clearAuth();
    this.router.navigate(['/']);
  }

  isAuthenticated(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return !!localStorage.getItem('accessToken');
  }
}
