import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../core/api/auth.service';

export const adminAuthGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).signedIn()) {
    return true;
  }
  return inject(Router).createUrlTree(['/admin/login'], {
    queryParams: { returnUrl: state.url },
  });
};
