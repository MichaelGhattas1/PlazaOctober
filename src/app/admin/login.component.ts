import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/api/auth.service';
import { errorMessage } from '../shared/http-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="grid min-h-screen place-items-center bg-navy-950 px-4 py-10 text-sand">
      <form class="panel grid w-full max-w-md gap-5" [formGroup]="form" (ngSubmit)="submit()">
        <a routerLink="/" class="flex items-center gap-3">
          <img src="logo-mark.png" alt="" class="h-12 w-auto" />
          <img src="logo-type.png" alt="Plaza Inn" class="h-6 w-auto" />
        </a>
        <div>
          <p class="kicker">Admin</p>
          <h1 class="mt-2 text-5xl text-ink">Sign in</h1>
        </div>
        <label class="field">
          <span>Email</span>
          <input type="email" formControlName="email" autocomplete="username" />
        </label>
        <label class="field">
          <span>Password</span>
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>
        @if (error()) {
          <p class="text-sm text-red-800">{{ error() }}</p>
        }
        <button class="btn-ink" type="submit" [disabled]="busy() || form.invalid">
          {{ busy() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected submit(): void {
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const target =
          returnUrl?.startsWith('/admin') && !returnUrl.startsWith('/admin/login') ? returnUrl : '/admin';
        void this.router.navigateByUrl(target);
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.busy.set(false);
      },
    });
  }
}
