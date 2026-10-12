import { Component, computed, inject } from '@angular/core';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { loadOnLanguage } from '../shared/load';
import { uiCopy } from '../shared/ui-copy';
import { HotelCard } from './hotel-card.component';

@Component({
  selector: 'app-hotels',
  imports: [HotelCard],
  template: `
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <p class="kicker">Plaza Inn</p>
        <h1 class="mt-3 font-serif text-5xl text-white md:text-6xl">{{ copy().hotels }}</h1>
      </div>
      @if (hotels().status === 'loading') {
        <p class="text-center text-sand/60">{{ copy().loading }}</p>
      } @else if (hotels().status === 'error') {
        <p class="mx-auto max-w-xl text-center text-sand/60">{{ hotels().error }}</p>
      } @else if (hotels().data?.length) {
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          @for (hotel of hotels().data; track hotel.id) {
            <app-hotel-card [hotel]="hotel" />
          }
        </div>
      } @else {
        <p class="text-center text-sand/60">{{ copy().noHotels }}</p>
      }
    </section>
  `,
})
export class HotelsPage {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  protected readonly hotels = loadOnLanguage(() => this.users.hotels());
  protected readonly copy = computed(() => uiCopy(this.language.code()));
}
