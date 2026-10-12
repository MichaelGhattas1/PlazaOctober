import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TripDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { formatPrice, imageUrl } from '../shared/format';
import { uiCopy } from '../shared/ui-copy';

@Component({
  selector: 'app-trip-card',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/trips', trip().id]"
      class="group flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-navy-900 shadow-lg transition duration-300 hover:border-gold-500/50"
    >
      <div class="relative h-64 overflow-hidden bg-navy-950">
        @if (photo(); as src) {
          <img
            [src]="src"
            [alt]="title()"
            class="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            (error)="failed.set(src)"
          />
        }
        <div class="absolute bottom-4 left-4 rounded bg-navy-950/80 px-3 py-1 text-xs font-medium text-sand backdrop-blur-md">
          {{ trip().durationInHours }} {{ copy().hours }}
        </div>
      </div>
      <div class="flex flex-1 flex-col justify-between p-6">
        <div>
          <h2 class="font-serif text-xl font-bold text-white transition group-hover:text-gold-400">{{ title() }}</h2>
          @if (trip().shortDescription) {
            <p class="mt-2 line-clamp-3 text-xs leading-relaxed font-light text-sand/60">{{ trip().shortDescription }}</p>
          }
        </div>
        <div class="mt-6 border-t border-white/5 pt-4">
          <span class="block text-[10px] tracking-wider text-sand/50 uppercase">{{ copy().journeys }}</span>
          <span class="font-serif text-2xl font-bold text-gold-400">{{ price() }}</span>
        </div>
      </div>
    </a>
  `,
})
export class TripCard {
  readonly trip = input.required<TripDto>();
  private readonly language = inject(LanguageService);
  protected readonly failed = signal<string | null>(null);
  protected readonly copy = computed(() => uiCopy(this.language.code()));
  protected readonly title = computed(() => this.trip().title || this.copy().untitled);
  protected readonly price = computed(() =>
    formatPrice(this.trip().price, this.trip().currency, this.language.code()),
  );
  protected readonly photo = computed(() => {
    const src = imageUrl(this.trip());
    return src && src !== this.failed() ? src : null;
  });
}
