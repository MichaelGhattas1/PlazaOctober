import { Component, computed, inject } from '@angular/core';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { loadOnLanguage } from '../shared/load';
import { uiCopy } from '../shared/ui-copy';
import { TripCard } from './trip-card.component';

@Component({
  selector: 'app-trips',
  imports: [TripCard],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <p class="kicker">Plaza Inn</p>
        <h1 class="mt-3 font-serif text-5xl text-white md:text-6xl">{{ copy().journeys }}</h1>
      </div>
      @if (trips().status === 'loading') {
        <p class="text-center text-sand/60">{{ copy().loading }}</p>
      } @else if (trips().status === 'error') {
        <p class="text-center text-sand/60">{{ trips().error }}</p>
      } @else if (trips().data?.length) {
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          @for (trip of trips().data; track trip.id) {
            <app-trip-card [trip]="trip" />
          }
        </div>
      } @else {
        <p class="text-center text-sand/60">{{ copy().noTrips }}</p>
      }
    </section>
  `,
})
export class TripsPage {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  protected readonly trips = loadOnLanguage(() => this.users.trips());
  protected readonly copy = computed(() => uiCopy(this.language.code()));
}
