import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { HotelDto, TripDto, VenueDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { documentsOf, galleryOf, imageUrl, mapLink, starSlots } from '../shared/format';
import { loadByRouteId } from '../shared/load';
import { uiCopy, venueTypeName } from '../shared/ui-copy';
import { TripCard } from './trip-card.component';

interface HotelPageData {
  hotel: HotelDto;
  venues: VenueDto[];
  trips: TripDto[];
}

@Component({
  selector: 'app-hotel-detail',
  imports: [RouterLink, TripCard],
  template: `
    <article class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <a routerLink="/hotels" class="text-xs font-semibold tracking-widest text-gold-400 uppercase hover:text-gold-300">{{ copy().backToHotels }}</a>
      @if (page().status === 'loading') {
        <p class="mt-8 text-sand/60">{{ copy().loading }}</p>
      } @else if (page().status === 'missing') {
        <h1 class="mt-6 font-serif text-5xl text-white">{{ copy().notFound }}</h1>
      } @else if (page().status === 'error') {
        <p class="mt-8 text-sand/60">{{ page().error }}</p>
      } @else if (page().data) {
        <header class="mt-6 overflow-hidden rounded-xl border border-gold-500/30 bg-navy-900 text-white shadow-2xl">
          @if (shown(cover()); as src) {
            <img [src]="src" [alt]="title()" class="aspect-[16/8] w-full object-cover" (error)="hide(src)" />
          }
          <div class="grid gap-3 p-8 md:p-12">
            <p class="tracking-[0.2em] text-gold-400">
              @for (filled of stars(); track $index) {
                <span [class.opacity-30]="!filled">★</span>
              }
            </p>
            <h1 class="font-serif text-5xl leading-none text-white md:text-6xl">{{ title() }}</h1>
            @if (place()) {
              <p class="text-sand/70">{{ place() }}</p>
            }
          </div>
        </header>

        <div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div class="grid gap-6">
            @if (page().data?.hotel?.shortDescription) {
              <p class="text-xl leading-8 font-light text-sand/90">{{ page().data?.hotel?.shortDescription }}</p>
            }
            @if (page().data?.hotel?.detailedDescription) {
              <p class="leading-8 font-light whitespace-pre-line text-sand/70">{{ page().data?.hotel?.detailedDescription }}</p>
            }
          </div>
          <aside class="grid h-fit gap-3 rounded-xl border border-gold-500/30 bg-navy-900 p-6 text-sm">
            <p class="kicker">{{ copy().contact }}</p>
            @if (page().data?.hotel?.phone) {
              <a class="text-sand" [href]="'tel:' + page().data?.hotel?.phone">{{ page().data?.hotel?.phone }}</a>
            }
            @if (page().data?.hotel?.email) {
              <a class="text-sand" [href]="'mailto:' + page().data?.hotel?.email">{{ page().data?.hotel?.email }}</a>
            }
            @if (page().data?.hotel?.address) {
              <p class="text-sand/70">{{ page().data?.hotel?.address }}</p>
            }
            @if (map(); as href) {
              <a class="btn-gold-line w-fit" [href]="href" target="_blank" rel="noopener">{{ copy().openMap }}</a>
            }
          </aside>
        </div>

        @if (pictures().length) {
          <section class="mt-14">
            <p class="kicker">{{ copy().gallery }}</p>
            <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              @for (image of pictures(); track image.id) {
                @if (shown(image.fileUrl); as src) {
                  <img [src]="src" [alt]="image.fileName || title()" class="aspect-[4/3] w-full rounded-xl border border-white/10 object-cover" (error)="hide(src)" />
                }
              }
            </div>
          </section>
        }

        @if (documents().length) {
          <section class="mt-14">
            <p class="kicker">{{ copy().documents }}</p>
            <ul class="mt-4 grid gap-2">
              @for (file of documents(); track file.id) {
                <li><a class="text-sm text-gold-400 hover:text-gold-300" [href]="file.fileUrl" target="_blank" rel="noopener">{{ file.fileName || file.category }}</a></li>
              }
            </ul>
          </section>
        }

        <section class="mt-16">
          <h2 class="font-serif text-4xl text-white">{{ copy().venues }}</h2>
          @if (page().data?.venues?.length) {
            <div class="mt-6 grid gap-4 md:grid-cols-2">
              @for (venue of page().data?.venues ?? []; track venue.id) {
                <a [routerLink]="['/venues', venue.id]" class="block rounded-xl border border-white/10 bg-navy-900 p-6 transition hover:border-gold-500/40">
                  <p class="kicker">{{ venueName(venue.venueType) }}</p>
                  <h3 class="mt-2 font-serif text-3xl text-white">{{ venue.name || copy().untitled }}</h3>
                  @if (venue.cuisineType || venue.openingHours) {
                    <p class="mt-2 text-sm text-sand/60">{{ venue.cuisineType }} {{ venue.openingHours }}</p>
                  }
                  @if (venue.description) {
                    <p class="mt-3 line-clamp-3 text-sm leading-6 text-sand/60">{{ venue.description }}</p>
                  }
                </a>
              }
            </div>
          } @else {
            <p class="mt-4 text-sand/60">{{ copy().noVenues }}</p>
          }
        </section>

        @if (page().data?.trips?.length) {
          <section class="mt-16">
            <h2 class="font-serif text-4xl text-white">{{ copy().journeys }}</h2>
            <div class="mt-6 grid gap-6 md:grid-cols-2">
              @for (trip of page().data?.trips ?? []; track trip.id) {
                <app-trip-card [trip]="trip" />
              }
            </div>
          </section>
        }
      }
    </article>
  `,
})
export class HotelDetailPage {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  protected readonly page = loadByRouteId<HotelPageData>((id) =>
    forkJoin({
      hotel: this.users.hotel(id),
      venues: this.users.venues(id).pipe(catchError(() => of([] as VenueDto[]))),
      trips: this.users.trips(id).pipe(catchError(() => of([] as TripDto[]))),
    }),
  );
  protected readonly copy = computed(() => uiCopy(this.language.code()));
  protected readonly title = computed(() => this.page().data?.hotel.name || this.copy().untitled);
  protected readonly cover = computed(() => {
    const hotel = this.page().data?.hotel;
    return hotel ? imageUrl(hotel) : null;
  });
  protected readonly stars = computed(() => starSlots(this.page().data?.hotel.starRating ?? 0));
  protected readonly place = computed(() => {
    const hotel = this.page().data?.hotel;
    return hotel ? [hotel.city, hotel.country].filter(Boolean).join(' · ') : '';
  });
  protected readonly map = computed(() => {
    const hotel = this.page().data?.hotel;
    return hotel ? mapLink(hotel) : null;
  });
  protected readonly pictures = computed(() =>
    galleryOf(this.page().data?.hotel.mediaAssets, this.cover()),
  );
  protected readonly documents = computed(() => documentsOf(this.page().data?.hotel.mediaAssets));

  protected venueName(type: VenueDto['venueType']): string {
    return venueTypeName(this.language.code(), type);
  }

  private readonly failed = signal<ReadonlySet<string>>(new Set());

  protected hide(src: string): void {
    this.failed.update((current) => new Set([...current, src]));
  }

  protected shown(src: string | null | undefined): string | null {
    return src && !this.failed().has(src) ? src : null;
  }
}
