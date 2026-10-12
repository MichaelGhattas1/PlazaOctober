import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, switchMap } from 'rxjs';
import { CompanyProfileDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { errorMessage } from '../shared/http-error';

export interface CompanyState {
  status: 'loading' | 'ready' | 'missing' | 'error';
  data: CompanyProfileDto | null;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class PublicCompanyService {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);

  readonly state = toSignal(
    toObservable(this.language.code).pipe(
      switchMap(() =>
        this.users.company().pipe(
          map((data): CompanyState => ({ status: 'ready', data, error: null })),
          catchError((error: unknown) =>
            of<CompanyState>(
              error instanceof HttpErrorResponse && error.status === 404
                ? { status: 'missing', data: null, error: null }
                : { status: 'error', data: null, error: errorMessage(error) },
            ),
          ),
        ),
      ),
    ),
    { initialValue: { status: 'loading', data: null, error: null } satisfies CompanyState },
  );
}
