import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable } from 'rxjs';
import { brandingApiPaths } from './api.config';
import { LoginRequest, LoginResponse } from './api.models';
import { BrandingHttp } from './branding-http.service';

const STORAGE_KEY = 'plaza-session';

export interface AuthSession {
  accessToken: string;
  expiresAtUtc: string | null;
  email: string | null;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(BrandingHttp);
  private readonly session = signal<AuthSession | null>(this.read());
  readonly email = computed(() => (this.isCurrent(this.session()) ? this.session()?.email ?? null : null));
  readonly signedIn = computed(() => this.isCurrent(this.session()));

  token(): string | null {
    const current = this.session();
    return this.isCurrent(current) ? current.accessToken : null;
  }

  login(email: string, password: string): Observable<AuthSession> {
    const body: LoginRequest = { email, password };
    return this.http.post<LoginResponse>(brandingApiPaths.authLogin, body).pipe(
        map((response) => {
          const accessToken = response.accessToken?.trim() ?? '';
          if (!accessToken) {
            throw new Error('The sign-in response did not include a token.');
          }
          const session: AuthSession = {
            accessToken,
            expiresAtUtc: response.expiresAtUtc,
            email: response.email ?? email,
            roles: response.roles ?? [],
          };
          this.persist(session);
          return session;
        }),
      );
  }

  signOut(): void {
    this.persist(null);
  }

  private persist(session: AuthSession | null): void {
    this.session.set(session);
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  private read(): AuthSession | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession>;
      if (!parsed.accessToken) {
        return null;
      }
      const session: AuthSession = {
        accessToken: parsed.accessToken,
        expiresAtUtc: parsed.expiresAtUtc ?? null,
        email: parsed.email ?? null,
        roles: Array.isArray(parsed.roles) ? parsed.roles.filter((role) => typeof role === 'string') : [],
      };
      return this.isCurrent(session) ? session : null;
    } catch {
      return null;
    }
  }

  private isCurrent(session: AuthSession | null): session is AuthSession {
    if (!session?.accessToken) {
      return false;
    }
    if (!session.expiresAtUtc) {
      return true;
    }
    const expires = Date.parse(session.expiresAtUtc);
    return Number.isNaN(expires) || expires > Date.now();
  }
}
