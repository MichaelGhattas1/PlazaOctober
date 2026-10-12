import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { HotelDto, VenueDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { documentsOf, galleryOf, imageUrl } from '../shared/format';
import { loadByRouteId } from '../shared/load';
import { uiCopy, venueTypeName } from '../shared/ui-copy';

interface VenuePageData {
  venue: VenueDto;
  hotel: HotelDto | null;
}

@Component({
  selector: 'app-venue-detail',
  imports: [RouterLink],
  template: `
    <article class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      @if (page().data?.hotel) {
        <a [routerLink]="['/hotels', page().data?.hotel?.id]" class="text-xs font-semibold tracking-widest text-gold-400 uppercase hover:text-gold-300">{{ copy().backToHotel }}</a>
      } @else {
        <a routerLink="/hotels" class="text-xs font-semibold tracking-widest text-gold-400 uppercase hover:text-gold-300">{{ copy().backToHotels }}</a>
      }
      @if (page().status === 'loading') {
        <p class="mt-8 text-sand/60">{{ copy().loading }}</p>
      } @else if (page().status === 'missing') {
        <h1 class="mt-6 font-serif text-5xl text-white">{{ copy().notFound }}</h1>
      } @else if (page().status === 'error') {
        <p class="mt-8 text-sand/60">{{ page().error }}</p>
      } @else if (page().data) {
        <p class="kicker mt-6">{{ typeLabel() }}</p>
        <h1 class="mt-3 font-serif text-5xl text-white md:text-6xl">{{ page().data?.venue?.name || copy().untitled }}</h1>
        @if (page().data?.hotel?.name) {
          <p class="mt-3 text-sand/60">{{ page().data?.hotel?.name }}</p>
        }
        @if (shown(cover()); as src) {
          <img [src]="src" [alt]="page().data?.venue?.name || ''" class="mt-8 aspect-[16/8] w-full rounded-xl border border-gold-500/30 object-cover" (error)="hide(src)" />
        }
        <div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div class="grid gap-4">
            @if (page().data?.venue?.description) {
              <p class="leading-8 font-light whitespace-pre-line text-sand/70">{{ page().data?.venue?.description }}</p>
            }
          </div>
          <aside class="grid h-fit gap-3 rounded-xl border border-gold-500/30 bg-navy-900 p-6 text-sm text-sand/80">
            @if (page().data?.venue?.cuisineType) {
              <p>{{ page().data?.venue?.cuisineType }}</p>
            }
            @if (page().data?.venue?.openingHours) {
              <p>{{ page().data?.venue?.openingHours }}</p>
            }
            @if (page().data?.venue?.menuPdfUrl) {
              <a class="btn-gold-line w-fit" [href]="page().data?.venue?.menuPdfUrl" target="_blank" rel="noopener">{{ copy().openMenu }}</a>
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
export class VenueDetailPage {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  protected readonly page = loadByRouteId<VenuePageData>((id) =>
    this.users.venue(id).pipe(
      switchMap((venue) =>
        forkJoin({
          venue: of(venue),
          hotel: this.users.hotel(venue.hotelId).pipe(catchError(() => of(null))),
        }),
      ),
    ),
  );
  protected readonly copy = computed(() => uiCopy(this.language.code()));
  protected readonly typeLabel = computed(() => {
    const type = this.page().data?.venue.venueType;
    return type ? venueTypeName(this.language.code(), type) : '';
  });
  protected readonly cover = computed(() => {
    const venue = this.page().data?.venue;
    return venue ? imageUrl(venue) : null;
  });
  protected readonly pictures = computed(() => galleryOf(this.page().data?.venue.mediaAssets, this.cover()));
  protected readonly documents = computed(() => documentsOf(this.page().data?.venue.mediaAssets));
  private readonly failed = signal<ReadonlySet<string>>(new Set());

  protected hide(src: string): void {
    this.failed.update((current) => new Set([...current, src]));
  }

  protected shown(src: string | null | undefined): string | null {
    return src && !this.failed().has(src) ? src : null;
  }
}
