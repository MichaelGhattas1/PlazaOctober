import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VenueDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { loadOnLanguage } from '../shared/load';
import { uiCopy, venueTypeName } from '../shared/ui-copy';

@Component({
  selector: 'app-venues',
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <p class="kicker">Plaza Inn</p>
        <h1 class="mt-3 font-serif text-5xl text-white md:text-6xl">{{ copy().venues }}</h1>
      </div>
      @if (venues().status === 'loading') {
        <p class="text-center text-sand/60">{{ copy().loading }}</p>
      } @else if (venues().status === 'error') {
        <p class="text-center text-sand/60">{{ venues().error }}</p>
      } @else if (venues().data?.length) {
        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          @for (venue of venues().data; track venue.id) {
            <a
              [routerLink]="['/venues', venue.id]"
              class="group rounded-xl border border-white/5 bg-navy-900 p-8 transition duration-300 hover:-translate-y-1 hover:border-gold-500/40"
            >
              <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-lg border border-gold-500/30 bg-gold-500/10 font-serif text-2xl text-gold-400 transition group-hover:bg-gold-500 group-hover:text-navy-950">
                {{ venueMark(venue) }}
              </div>
              <p class="text-[10px] font-semibold tracking-widest text-gold-400 uppercase">{{ venueName(venue.venueType) }}</p>
              <h2 class="mt-2 font-serif text-xl font-bold text-white">{{ venue.name || copy().untitled }}</h2>
              @if (venue.description) {
                <p class="mt-3 line-clamp-3 text-sm leading-relaxed font-light text-sand/60">{{ venue.description }}</p>
              }
            </a>
          }
        </div>
      } @else {
        <p class="text-center text-sand/60">{{ copy().noVenues }}</p>
      }
    </section>
  `,
})
export class VenuesPage {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  protected readonly venues = loadOnLanguage(() => this.users.venues());
  protected readonly copy = computed(() => uiCopy(this.language.code()));

  protected venueName(type: VenueDto['venueType']): string {
    return venueTypeName(this.language.code(), type);
  }

  protected venueMark(venue: VenueDto): string {
    return (venue.name || venue.venueType || 'P').trim().charAt(0);
  }
}
