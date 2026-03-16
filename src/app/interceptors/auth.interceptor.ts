import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { APP_CONFIG } from '../config';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

export const authInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const http = inject(HttpClient);
  const config = inject(APP_CONFIG);

  // Helper to check if URL should include auth
  const shouldAddAuth = (url: string): boolean => {
    return url.startsWith('/') || url.startsWith(config.apiUrl);
  };

  // Only add auth headers on browser and for API URLs
  if (isPlatformBrowser(platformId) && shouldAddAuth(req.url)) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse): Observable<HttpEvent<unknown>> => {
      // Only handle 401 errors for API URLs
      if (error.status === 401 && shouldAddAuth(req.url) && isPlatformBrowser(platformId)) {
        // If refresh endpoint fails, redirect to login
        if (req.url === '/auth/refresh') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          router.navigate(['/login']);
          return throwError(() => error);
        }

        // If already retried, fail
        if ((req as any)._retry) {
          return throwError(() => error);
        }

        // If refresh is in progress, queue this request
        if (isRefreshing) {
          return new Observable(observer => {
            failedQueue.push({
              resolve: (token: string) => {
                const retryReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${token}` }
                });
                next(retryReq).subscribe({
                  next: (response) => observer.next(response),
                  error: (err) => observer.error(err),
                  complete: () => observer.complete()
                });
              },
              reject: (err: any) => observer.error(err)
            });
          });
        }

        // Start refresh process
        (req as any)._retry = true;
        isRefreshing = true;

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          localStorage.removeItem('accessToken');
          router.navigate(['/login']);
          return throwError(() => error);
        }

        // Make refresh request (use full URL to avoid recursive interceptor)
        return http.post<{ accessToken: string; refreshToken: string }>(
          `${config.apiUrl}/auth/refresh`,
          { refreshToken }
        ).pipe(
          switchMap((data) => {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            
            processQueue(null, data.accessToken);
            isRefreshing = false;

            // Retry original request with new token
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${data.accessToken}` }
            });
            return next(retryReq);
          }),
          catchError((refreshError) => {
            processQueue(refreshError, null);
            isRefreshing = false;
            
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.navigate(['/login']);
            
            return throwError(() => refreshError);
          })
        );
      }

      return throwError(() => error);
    })
  );
};
