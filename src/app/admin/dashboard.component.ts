import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { AdminBrandingService } from '../core/api/admin-branding.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <p class="kicker">Desk</p>
    <h1 class="mt-3 text-6xl">Overview</h1>
    <p class="mt-4 max-w-2xl text-bark">
      Visitors can only read the public site. This desk creates, updates, and deletes the records they see.
    </p>
    @if (loading()) {
      <p class="mt-8 text-bark">Loading the collection…</p>
    } @else {
      <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (card of cards(); track card.path) {
          <a [routerLink]="card.path" class="panel block">
            <p class="text-sm text-bark">{{ card.label }}</p>
            <p class="mt-2 font-sans text-5xl tabular-nums">{{ card.count }}</p>
          </a>
        }
      </div>
      <p class="mt-6 text-sm text-bark">API status: {{ health() }}</p>
    }
  `,
})
export class DashboardPage {
  private readonly admin = inject(AdminBrandingService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(true);
  protected readonly health = signal('Checking');
  protected readonly cards = signal<{ label: string; count: number; path: string }[]>([]);

  constructor() {
    const count = (source: Observable<unknown[]>) =>
      source.pipe(
        map((rows) => rows.length),
        catchError(() => of(0)),
      );
    forkJoin({
      companies: count(this.admin.listCompanies()),
      hotels: count(this.admin.listHotels()),
      venues: count(this.admin.listVenues()),
      trips: count(this.admin.listTrips()),
      events: count(this.admin.listEvents()),
      owners: count(this.admin.listOwners()),
      sponsors: count(this.admin.listSponsors(false)),
      media: count(this.admin.listMedia()),
      health: this.admin.health().pipe(
        map((body) => {
          const trimmed = body.trim();
          if (!trimmed || trimmed.startsWith('{')) {
            return 'Reachable';
          }
          return trimmed;
        }),
        catchError(() => of('Unreachable')),
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        this.health.set(result.health.trim() || 'Reachable');
        this.cards.set([
          { label: 'Company profiles', count: result.companies, path: '/admin/company' },
          { label: 'Hotels', count: result.hotels, path: '/admin/hotels' },
          { label: 'Venues', count: result.venues, path: '/admin/venues' },
          { label: 'Trips', count: result.trips, path: '/admin/trips' },
          { label: 'Events', count: result.events, path: '/admin/events' },
          { label: 'Owners', count: result.owners, path: '/admin/owners' },
          { label: 'Sponsors', count: result.sponsors, path: '/admin/sponsors' },
          { label: 'Media files', count: result.media, path: '/admin/media' },
        ]);
        this.loading.set(false);
      });
  }
}
