import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { EventDto, HotelDto, MediaAssetDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { filmSource, formatEventRange, imageUrl, isVideoMedia, isVisualMedia } from '../shared/format';
import { loadByRouteId } from '../shared/load';
import { uiCopy } from '../shared/ui-copy';

interface EventPageData {
  event: EventDto;
  hotel: HotelDto | null;
  assets: MediaAssetDto[];
}

interface FilmView {
  id: number;
  name: string;
  file: string | null;
  embed: SafeResourceUrl | null;
}

@Component({
  selector: 'app-event-detail',
  imports: [RouterLink],
  template: `
    <article class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <a routerLink="/events" class="text-xs font-semibold tracking-widest text-gold-400 uppercase hover:text-gold-300">{{ copy().backToEvents }}</a>
      @if (page().status === 'loading') {
        <p class="mt-8 text-sand/60">{{ copy().loading }}</p>
      } @else if (page().status === 'missing') {
        <h1 class="mt-6 font-serif text-5xl text-white">{{ copy().notFound }}</h1>
      } @else if (page().status === 'error') {
        <p class="mt-8 text-sand/60">{{ page().error }}</p>
      } @else if (page().data) {
        @if (when()) {
          <p class="kicker mt-6">{{ when() }}</p>
        }
        <h1 class="mt-3 max-w-4xl font-serif text-5xl leading-none text-white md:text-6xl">{{ page().data?.event?.title || copy().untitled }}</h1>
        @if (heroFile(); as src) {
          <video
            class="mt-8 aspect-video w-full rounded-xl border border-gold-500/30 bg-navy-950 object-contain"
            controls
            playsinline
            [poster]="poster()"
            [src]="src"
          ></video>
        } @else if (heroEmbed(); as src) {
          <iframe
            class="mt-8 aspect-video w-full rounded-xl border border-gold-500/30"
            [src]="src"
            [title]="page().data?.event?.title || copy().watchFilm"
            allow="autoplay; fullscreen; picture-in-picture"
            allowfullscreen
          ></iframe>
        } @else if (shown(cover()); as src) {
          <img [src]="src" [alt]="page().data?.event?.title || ''" class="mt-8 aspect-[16/8] w-full rounded-xl border border-gold-500/30 object-cover" (error)="hide(src)" />
        }
        <div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div class="grid gap-4">
            @if (page().data?.event?.shortDescription) {
              <p class="text-xl leading-8 font-light text-sand/90">{{ page().data?.event?.shortDescription }}</p>
            }
            @if (page().data?.event?.detailedDescription) {
              <p class="leading-8 font-light whitespace-pre-line text-sand/70">{{ page().data?.event?.detailedDescription }}</p>
            }
          </div>
          <aside class="grid h-fit gap-4 rounded-xl border border-gold-500/30 bg-navy-900 p-6">
            @if (page().data?.event?.location) {
              <div>
                <p class="kicker">{{ copy().address }}</p>
                <p class="mt-2 text-sand/80">{{ page().data?.event?.location }}</p>
              </div>
            }
            @if (page().data?.hotel) {
              <a class="font-serif text-3xl text-white hover:text-gold-400" [routerLink]="['/hotels', page().data?.hotel?.id]">{{ page().data?.hotel?.name }}</a>
            }
          </aside>
        </div>
        @if (pictures().length || films().length) {
          <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @for (image of pictures(); track image.id) {
              @if (shown(image.fileUrl); as src) {
                <img [src]="src" [alt]="image.fileName || ''" class="aspect-[4/3] w-full rounded-xl border border-white/10 object-cover" (error)="hide(src)" />
              }
            }
            @for (film of films(); track film.id) {
              @if (film.file) {
                <video class="aspect-[4/3] w-full rounded-xl border border-white/10 bg-navy-950 object-contain" controls playsinline [src]="film.file"></video>
              } @else if (film.embed) {
                <iframe class="aspect-[4/3] w-full rounded-xl border border-white/10" [src]="film.embed" [title]="film.name" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>
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
export class EventDetailPage {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly page = loadByRouteId<EventPageData>((id) =>
    this.users.event(id).pipe(
      switchMap((event) =>
        forkJoin({
          event: of(event),
          hotel: event.hotelId
            ? this.users.hotel(event.hotelId).pipe(catchError(() => of(null)))
            : of(null),
          assets: this.eventMedia(event),
        }),
      ),
    ),
  );
  protected readonly copy = computed(() => uiCopy(this.language.code()));
  protected readonly when = computed(() => {
    const event = this.page().data?.event;
    return event
      ? formatEventRange(event.startDate, event.endDate, event.isAllDay, this.language.code())
      : '';
  });
  protected readonly assets = computed(() => this.page().data?.assets ?? []);
  protected readonly heroVideo = computed(() => this.assets().find((asset) => isVideoMedia(asset)) ?? null);
  protected readonly heroFile = computed(() => {
    const asset = this.heroVideo();
    const film = filmSource(asset?.fileUrl);
    if (!asset?.fileUrl || film?.kind === 'youtube' || film?.kind === 'vimeo') {
      return null;
    }
    return asset.fileUrl;
  });
  protected readonly heroEmbed = computed((): SafeResourceUrl | null => this.embed(this.heroVideo()?.fileUrl));
  protected readonly poster = computed(() => this.page().data?.event.coverImageUrl);
  protected readonly cover = computed(() => {
    if (this.heroVideo()) {
      return null;
    }
    const event = this.page().data?.event;
    return event ? imageUrl(event) : null;
  });
  protected readonly pictures = computed(() => {
    const skip = this.heroVideo() ? null : this.cover();
    return this.assets().filter((asset) => this.isPicture(asset) && asset.fileUrl !== skip);
  });
  protected readonly films = computed((): FilmView[] => {
    const heroId = this.heroVideo()?.id;
    return this.assets()
      .filter((asset) => asset.id !== heroId && isVideoMedia(asset))
      .map((asset) => ({
        id: asset.id,
        name: asset.fileName || this.copy().watchFilm,
        file: this.fileSource(asset.fileUrl),
        embed: this.embed(asset.fileUrl),
      }));
  });
  protected readonly documents = computed(() =>
    this.assets().filter((asset) => asset.fileUrl && !isVideoMedia(asset) && !this.isPicture(asset)),
  );

  private readonly failed = signal<ReadonlySet<string>>(new Set());

  protected hide(src: string): void {
    this.failed.update((current) => new Set([...current, src]));
  }

  protected shown(src: string | null | undefined): string | null {
    return src && !this.failed().has(src) ? src : null;
  }

  private eventMedia(event: EventDto): Observable<MediaAssetDto[]> {
    const linked = (event.mediaAssets ?? []).filter((asset) => asset.fileUrl);
    if (linked.length) {
      return of(linked);
    }
    const ids = (event.mediaAssetIds ?? '')
      .split(/[^0-9]+/)
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0);
    if (ids.length) {
      return forkJoin(ids.map((id) => this.users.mediaAsset(id).pipe(catchError(() => of(null))))).pipe(
        map((rows) => rows.filter((asset): asset is MediaAssetDto => !!asset?.fileUrl)),
      );
    }
    return of([]);
  }

  private isPicture(asset: MediaAssetDto): boolean {
    if (!asset.fileUrl || isVideoMedia(asset)) {
      return false;
    }
    return isVisualMedia(asset.category) || (asset.contentType ?? '').toLowerCase().startsWith('image/');
  }

  private fileSource(url: string | null | undefined): string | null {
    const film = filmSource(url);
    if (!url || film?.kind === 'youtube' || film?.kind === 'vimeo') {
      return null;
    }
    return url;
  }

  private embed(url: string | null | undefined): SafeResourceUrl | null {
    const film = filmSource(url);
    if (film?.kind === 'youtube') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${film.id}?rel=0&playsinline=1`,
      );
    }
    if (film?.kind === 'vimeo') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://player.vimeo.com/video/${film.id}`);
    }
    return null;
  }
}
