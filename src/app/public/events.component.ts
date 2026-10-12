import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { formatEventRange, imageUrl } from '../shared/format';
import { loadOnLanguage } from '../shared/load';
import { uiCopy } from '../shared/ui-copy';

@Component({
  selector: 'app-events',
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <p class="kicker">Plaza Inn</p>
        <h1 class="mt-3 font-serif text-5xl text-white md:text-6xl">{{ copy().events }}</h1>
      </div>
      @if (events().status === 'loading') {
        <p class="text-center text-sand/60">{{ copy().loading }}</p>
      } @else if (events().status === 'ready' && events().data?.length) {
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          @for (event of events().data; track event.id) {
            <a [routerLink]="['/events', event.id]" class="overflow-hidden rounded-xl border border-white/10 bg-navy-900 shadow-lg transition hover:border-gold-500/40">
              @if (eventImage(event); as src) {
                <img [src]="src" [alt]="eventTitle(event)" class="h-56 w-full object-cover" />
              }
              <div class="p-6">
                @if (eventWhen(event)) {
                  <p class="text-xs font-semibold tracking-widest text-gold-400 uppercase">{{ eventWhen(event) }}</p>
                }
                <h2 class="mt-2 font-serif text-2xl font-bold text-white">{{ eventTitle(event) }}</h2>
                @if (event.location) {
                  <p class="mt-2 text-sm text-sand/60">{{ event.location }}</p>
                }
                @if (event.shortDescription) {
                  <p class="mt-3 line-clamp-3 text-sm leading-relaxed font-light text-sand/70">{{ event.shortDescription }}</p>
                }
              </div>
            </a>
          }
        </div>
      } @else if (events().status === 'error') {
        <p class="text-center text-sand/60">{{ events().error }}</p>
      } @else {
        <p class="mx-auto max-w-xl text-center text-lg font-light text-sand/70">{{ copy().eventsSoon }}</p>
      }
    </section>
  `,
})
export class EventsPage {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  protected readonly events = loadOnLanguage(() => this.users.events());
  protected readonly copy = computed(() => uiCopy(this.language.code()));

  protected eventTitle(event: EventDto): string {
    return event.title || this.copy().untitled;
  }

  protected eventImage(event: EventDto): string | null {
    return imageUrl(event);
  }

  protected eventWhen(event: EventDto): string {
    return formatEventRange(event.startDate, event.endDate, event.isAllDay, this.language.code());
  }
}
