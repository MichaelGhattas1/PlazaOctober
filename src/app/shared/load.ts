import { HttpErrorResponse } from '@angular/common/http';
import { inject, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { catchError, combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { LanguageService } from '../core/api/language.service';
import { errorMessage } from './http-error';

export type LoadStatus = 'loading' | 'ready' | 'missing' | 'error';

export interface LoadState<T> {
  status: LoadStatus;
  data: T | null;
  error: string | null;
}

export function loadingState<T>(): LoadState<T> {
  return { status: 'loading', data: null, error: null };
}

export function missingState<T>(): LoadState<T> {
  return { status: 'missing', data: null, error: null };
}

export function asLoad<T>() {
  return (source: Observable<T>): Observable<LoadState<T>> =>
    source.pipe(
      map((data): LoadState<T> => ({ status: 'ready', data, error: null })),
      catchError((error: unknown) =>
        of(
          error instanceof HttpErrorResponse && error.status === 404
            ? missingState<T>()
            : { status: 'error' as const, data: null, error: errorMessage(error) },
        ),
      ),
    );
}

export function loadOnLanguage<T>(request: () => Observable<T>): Signal<LoadState<T>> {
  const language = inject(LanguageService);
  return toSignal(toObservable(language.code).pipe(switchMap(() => request().pipe(asLoad<T>()))), {
    initialValue: loadingState<T>(),
  });
}

export function loadByRouteId<T>(request: (id: number) => Observable<T>): Signal<LoadState<T>> {
  const route = inject(ActivatedRoute);
  const language = inject(LanguageService);
  return toSignal(
    combineLatest([
      route.paramMap.pipe(map((params) => Number(params.get('id')))),
      toObservable(language.code),
    ]).pipe(
      switchMap(([id]) => {
        if (!Number.isInteger(id) || id <= 0) {
          return of(missingState<T>());
        }
        return request(id).pipe(asLoad<T>());
      }),
    ),
    { initialValue: loadingState<T>() },
  );
}
