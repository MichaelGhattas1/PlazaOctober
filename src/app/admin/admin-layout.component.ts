import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/api/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-cream text-ink md:grid md:grid-cols-[240px_1fr]" dir="ltr">
      <aside class="bg-navy-950 text-sand md:min-h-screen">
        <div class="px-6 py-6">
          <a routerLink="/" class="flex items-center gap-3">
            <img src="logo-mark.png" alt="" class="h-12 w-auto" />
            <span>
              <img src="logo-type.png" alt="Plaza Inn" class="h-5 w-auto" />
              <span class="mt-1 block text-xs tracking-[0.22em] text-gold-400 uppercase">Admin</span>
            </span>
          </a>
        </div>
        <nav class="flex gap-2 overflow-x-auto px-4 pb-4 md:grid md:px-3 md:pb-8">
          @for (link of links; track link.path) {
            <a
              [routerLink]="link.path"
              routerLinkActive="bg-white/10"
              [routerLinkActiveOptions]="{ exact: link.exact }"
              class="shrink-0 rounded-full px-4 py-2 text-sm text-cream/90 hover:bg-white/10 md:rounded-2xl"
            >
              {{ link.label }}
            </a>
          }
        </nav>
        <div class="px-6 pb-6">
          @if (email()) {
            <p class="truncate text-xs text-sand/70">{{ email() }}</p>
          }
          <button type="button" class="mt-3 text-sm text-gold-400 hover:text-gold-300" (click)="signOut()">
            Sign out
          </button>
        </div>
      </aside>
      <div class="px-4 py-8 md:px-10 md:py-10">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AdminLayout {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly email = this.auth.email;
  protected readonly links = [
    { path: '/admin', label: 'Overview', exact: true },
    { path: '/admin/company', label: 'Company', exact: false },
    { path: '/admin/hotels', label: 'Hotels', exact: false },
    { path: '/admin/venues', label: 'Venues', exact: false },
    { path: '/admin/trips', label: 'Trips', exact: false },
    { path: '/admin/events', label: 'Events', exact: false },
    { path: '/admin/owners', label: 'Owners', exact: false },
    { path: '/admin/sponsors', label: 'Sponsors', exact: false },
    { path: '/admin/media', label: 'Media', exact: false },
  ];

  protected signOut(): void {
    this.auth.signOut();
    void this.router.navigate(['/admin/login']);
  }
}
