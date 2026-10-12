import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from './api.config';
import { LanguageService } from './language.service';

export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  if (!req.url.startsWith(baseUrl) || req.headers.has('X-Language')) {
    return next(req);
  }

  const language = inject(LanguageService).code();
  return next(req.clone({ setHeaders: { 'X-Language': language } }));
};
