import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL, brandingApiPaths } from './api.config';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApi = req.url.startsWith(baseUrl);
  const isLogin = req.url.includes(brandingApiPaths.authLogin);
  const token = isApi && !isLogin ? auth.token() : null;
  const outgoing = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApi &&
        !isLogin &&
        router.url.startsWith('/admin')
      ) {
        auth.signOut();
        void router.navigate(['/admin/login']);
      }
      return throwError(() => error);
    }),
  );
};
