import { HttpErrorResponse } from '@angular/common/http';

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { detail?: unknown; title?: unknown; errors?: unknown } | null;
    if (body && typeof body === 'object') {
      if (typeof body.detail === 'string' && body.detail.trim()) {
        return body.detail;
      }
      if (typeof body.title === 'string' && body.title.trim() && body.title !== 'One or more validation errors occurred.') {
        return body.title;
      }
      if (body.errors && typeof body.errors === 'object') {
        const messages = Object.values(body.errors)
          .flat()
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
        if (messages.length) {
          return messages.join(' ');
        }
      }
    }
    if (error.status === 0) {
      return 'The branding service could not be reached.';
    }
  }
  return 'The request could not be completed.';
}
