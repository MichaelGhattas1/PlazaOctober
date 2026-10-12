import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HotelDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { imageUrl, starSlots } from '../shared/format';
import { uiCopy } from '../shared/ui-copy';

@Component({
  selector: 'app-hotel-card',
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="['/hotels', hotel().id]"
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
        <div class="absolute top-4 right-4 rounded-full border border-gold-500/40 bg-navy-950/80 px-3 py-1 text-xs font-bold text-gold-400 backdrop-blur-md">
          <span [attr.aria-label]="hotel().starRating + ' stars'">
            @for (filled of stars(); track $index) {
              <span [class.opacity-30]="!filled">★</span>
            }
          </span>
        </div>
        @if (place()) {
          <div class="absolute bottom-4 left-4 rounded bg-navy-950/80 px-3 py-1 text-xs font-medium text-sand backdrop-blur-md">
            {{ place() }}
          </div>
        }
      </div>
      <div class="flex flex-1 flex-col p-6">
        <h2 class="font-serif text-xl font-bold text-white transition group-hover:text-gold-400">{{ title() }}</h2>
        @if (hotel().shortDescription) {
          <p class="mt-2 line-clamp-3 text-xs leading-relaxed font-light text-sand/60">{{ hotel().shortDescription }}</p>
        }
        <span class="mt-auto pt-6 text-[11px] font-semibold tracking-wider text-gold-400 uppercase">{{ copy().viewHotel }}</span>
      </div>
    </a>
  `,
})
export class HotelCard {
  readonly hotel = input.required<HotelDto>();
  private readonly language = inject(LanguageService);
  protected readonly failed = signal<string | null>(null);
  protected readonly copy = computed(() => uiCopy(this.language.code()));
  protected readonly title = computed(() => this.hotel().name || this.copy().untitled);
  protected readonly stars = computed(() => starSlots(this.hotel().starRating));
  protected readonly place = computed(() =>
    [this.hotel().city, this.hotel().country].filter(Boolean).join(' · '),
  );
  protected readonly photo = computed(() => {
    const src = imageUrl(this.hotel());
    return src && src !== this.failed() ? src : null;
  });
}
