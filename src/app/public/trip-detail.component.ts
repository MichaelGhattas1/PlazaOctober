import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { HotelDto, TripDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { documentsOf, formatPrice, galleryOf, imageUrl } from '../shared/format';
import { loadByRouteId } from '../shared/load';
import { uiCopy } from '../shared/ui-copy';

interface TripPageData {
  trip: TripDto;
  hotel: HotelDto | null;
}

@Component({
  selector: 'app-trip-detail',
  imports: [RouterLink],
  template: `
    <article class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <a routerLink="/trips" class="text-xs font-semibold tracking-widest text-gold-400 uppercase hover:text-gold-300">{{ copy().backToJourneys }}</a>
      @if (page().status === 'loading') {
        <p class="mt-8 text-sand/60">{{ copy().loading }}</p>
      } @else if (page().status === 'missing') {
        <h1 class="mt-6 font-serif text-5xl text-white">{{ copy().notFound }}</h1>
      } @else if (page().status === 'error') {
        <p class="mt-8 text-sand/60">{{ page().error }}</p>
      } @else if (page().data) {
        <p class="kicker mt-6">{{ page().data?.trip?.durationInHours }} {{ copy().hours }}</p>
        <h1 class="mt-3 max-w-4xl font-serif text-5xl leading-none text-white md:text-6xl">{{ page().data?.trip?.title || copy().untitled }}</h1>
        <p class="mt-4 font-serif text-4xl text-gold-400">{{ price() }}</p>
        @if (shown(cover()); as src) {
          <img [src]="src" [alt]="page().data?.trip?.title || ''" class="mt-8 aspect-[16/8] w-full rounded-xl border border-gold-500/30 object-cover" (error)="hide(src)" />
        }
        <div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div class="grid gap-4">
            @if (page().data?.trip?.shortDescription) {
              <p class="text-xl leading-8 font-light text-sand/90">{{ page().data?.trip?.shortDescription }}</p>
            }
            @if (page().data?.trip?.detailedDescription) {
              <p class="leading-8 font-light whitespace-pre-line text-sand/70">{{ page().data?.trip?.detailedDescription }}</p>
            }
          </div>
          <aside class="grid h-fit gap-3 rounded-xl border border-gold-500/30 bg-navy-900 p-6">
            @if (page().data?.hotel) {
              <a class="font-serif text-3xl text-white hover:text-gold-400" [routerLink]="['/hotels', page().data?.hotel?.id]">{{ page().data?.hotel?.name }}</a>
            }
            @if (page().data?.trip?.meetingPoint) {
              <div>
                <p class="kicker">{{ copy().meetingPoint }}</p>
                <p class="mt-2 text-sand/80">{{ page().data?.trip?.meetingPoint }}</p>
              </div>
            }
          </aside>
        </div>
        @if (pictures().length) {
          <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (image of pictures(); track image.id) {
              @if (shown(image.fileUrl); as src) {
                <img [src]="src" [alt]="image.fileName || ''" class="aspect-[4/3] w-full rounded-xl border border-white/10 object-cover" (error)="hide(src)" />
              }
            }
          </div>
        }
        @if (documents().length) {
          <ul class="mt-8 grid gap-2">
            @for (file of documents(); track file.id) {
              <li><a class="text-sm text-gold-400 hover:text-gold-300" [href]="file.fileUrl" target="_blank" rel="noopener">{{ file.fileName || copy().documents }}</a></li>
            }
          </ul>
        }
      }
    </article>
  `,
})
export class TripDetailPage {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  protected readonly page = loadByRouteId<TripPageData>((id) =>
    this.users.trip(id).pipe(
      switchMap((trip) =>
        forkJoin({
          trip: of(trip),
          hotel: trip.hotelId
            ? this.users.hotel(trip.hotelId).pipe(catchError(() => of(null)))
            : of(null),
        }),
      ),
    ),
  );
  protected readonly copy = computed(() => uiCopy(this.language.code()));
  protected readonly price = computed(() => {
    const trip = this.page().data?.trip;
    return trip ? formatPrice(trip.price, trip.currency, this.language.code()) : '';
  });
  protected readonly cover = computed(() => {
    const trip = this.page().data?.trip;
    return trip ? imageUrl(trip) : null;
  });
  protected readonly pictures = computed(() => galleryOf(this.page().data?.trip.mediaAssets, this.cover()));
  protected readonly documents = computed(() => documentsOf(this.page().data?.trip.mediaAssets));
  private readonly failed = signal<ReadonlySet<string>>(new Set());

  protected hide(src: string): void {
    this.failed.update((current) => new Set([...current, src]));
  }

  protected shown(src: string | null | undefined): string | null {
    return src && !this.failed().has(src) ? src : null;
  }
}
