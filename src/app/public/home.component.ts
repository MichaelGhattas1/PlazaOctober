import { Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { EventDto, VenueDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { externalUrl, filmSource, formatEventRange, galleryOf, imageUrl } from '../shared/format';
import { loadOnLanguage } from '../shared/load';
import { uiCopy, venueTypeName } from '../shared/ui-copy';
import { HotelCard } from './hotel-card.component';
import { PreFooter } from './pre-footer.component';
import { PublicCompanyService } from './public-company.service';
import { TripCard } from './trip-card.component';

@Component({
  selector: 'app-home',
  imports: [HotelCard, TripCard, RouterLink, PreFooter],
  template: `
    <section class="bg-navy-900">
    <div class="mx-auto grid max-w-7xl items-stretch gap-4 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8">
      <div
        class="relative flex min-h-[32rem] flex-col justify-end overflow-hidden rounded-xl border border-gold-500/30 bg-navy-900 p-8 text-white shadow-2xl md:p-12 lg:min-h-[36rem]"
        [class.lg:col-span-8]="hasFilm()"
        [class.lg:col-span-12]="!hasFilm()"
        [class.items-center]="!hasFilm()"
        [class.justify-center]="!hasFilm()"
        [class.text-center]="!hasFilm()"
      >
        @if (hero(); as src) {
          <img
            [src]="src"
            alt=""
            class="absolute inset-0 h-full w-full object-cover"
            (error)="failedHero.set(src)"
          />
        }
        <div class="relative max-w-2xl rounded-2xl bg-navy-950/40 p-6 sm:p-8">
          <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-navy-900/60 px-4 py-1.5 backdrop-blur-md">
            <span class="h-2 w-2 rounded-full bg-gold-400"></span>
            <span class="text-[11px] font-medium tracking-[0.22em] text-gold-300 uppercase">{{ brand() }}</span>
          </div>
          <h1 class="font-serif text-5xl leading-tight font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
            {{ brand() }}
          </h1>
          @if (company().data?.aboutUs) {
            <p class="mt-6 line-clamp-4 text-base leading-relaxed font-light text-white sm:text-lg">{{ company().data?.aboutUs }}</p>
          } @else if (company().status === 'missing') {
            <p class="mt-6 text-lg text-white">{{ copy().publishedSoon }}</p>
          } @else if (company().status === 'error') {
            <p class="mt-6 text-lg text-white">{{ company().error }}</p>
          }
          <a routerLink="/hotels" class="btn-gold mt-8">{{ copy().viewHotel }}</a>
        </div>
      </div>
      @if (hasFilm()) {
        <div class="relative h-[32rem] overflow-hidden rounded-xl border border-gold-500/40 bg-navy-950 shadow-2xl lg:col-span-4 lg:h-auto lg:min-h-[36rem]">
          @if (fileSrc(); as src) {
            <video
              class="absolute inset-0 h-full w-full object-contain"
              autoplay
              loop
              playsinline
              muted
              [muted]="true"
              [attr.poster]="hero()"
              [src]="src"
              (loadeddata)="startFilm($event)"
            ></video>
          } @else if (embedUrl(); as src) {
            <!-- <iframe
              class="pointer-events-none absolute top-1/2 left-1/2 h-full min-h-full w-[180%] min-w-full -translate-x-1/2 -translate-y-1/2"
              [src]="src"
              [title]="copy().watchFilm"
              allow="autoplay; fullscreen; picture-in-picture"
            ></iframe> -->
          }
        </div>
      }
    </div>
    </section>

    @if (hasStory()) {
      <section class="relative overflow-hidden bg-navy-950 py-24">
        <div class="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div class="mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-widest text-gold-400 uppercase">
              <span class="h-px w-8 bg-gold-400"></span>
              {{ copy().about }}
            </div>
            <h2 class="mb-6 font-serif text-4xl leading-tight font-bold text-white sm:text-5xl">{{ brand() }}</h2>
            @if (company().data?.aboutUs) {
              <p class="mb-6 text-base leading-relaxed font-light text-sand/70">{{ company().data?.aboutUs }}</p>
            }
            @if (company().data?.vision) {
              <p class="mb-4 text-base leading-relaxed font-light text-sand/70">
                <span class="mb-1 block text-xs font-semibold tracking-widest text-gold-400 uppercase">{{ copy().vision }}</span>
                {{ company().data?.vision }}
              </p>
            }
            @if (company().data?.mission) {
              <p class="text-base leading-relaxed font-light text-sand/70">
                <span class="mb-1 block text-xs font-semibold tracking-widest text-gold-400 uppercase">{{ copy().mission }}</span>
                {{ company().data?.mission }}
              </p>
            }
          </div>
          <div class="relative">
            @if (leadPicture(); as src) {
              <div class="relative z-10 overflow-hidden rounded-lg border border-gold-500/20 shadow-2xl">
                <img [src]="src" [alt]="brand()" class="h-[450px] w-full object-cover" />
              </div>
            }
            @if (sidePicture(); as src) {
              <div class="absolute -bottom-8 -left-8 z-20 hidden w-48 overflow-hidden rounded-lg border-2 border-gold-500 shadow-2xl sm:block sm:w-64">
                <img [src]="src" alt="" class="h-48 w-full object-cover" />
              </div>
            }
            <div class="absolute -top-6 -right-6 -z-0 hidden h-full w-full rounded-lg border-2 border-gold-500/30 sm:block"></div>
          </div>
        </div>
      </section>
    }

    <section class="bg-navy-900 py-24 [&_a.group]:bg-navy-950">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto mb-16 max-w-3xl text-center">
          <span class="text-xs font-semibold tracking-widest text-gold-400 uppercase">{{ brand() }}</span>
          <h2 class="mt-3 mb-4 font-serif text-4xl font-bold text-white sm:text-5xl">{{ copy().hotels }}</h2>
        </div>
        @if (hotels().status === 'loading') {
          <p class="text-center text-sand/60">{{ copy().loading }}</p>
        } @else if (hotels().status === 'error') {
          <p class="text-center text-sand/60">{{ hotels().error }}</p>
        } @else if (hotels().data?.length) {
          <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            @for (hotel of hotels().data; track hotel.id) {
              <app-hotel-card [hotel]="hotel" />
            }
          </div>
        } @else {
          <p class="text-center text-sand/60">{{ copy().collectionSoon }}</p>
        }
      </div>
    </section>

    <section id="events" class="scroll-mt-28 bg-navy-950 py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mx-auto mb-16 max-w-3xl text-center">
          <span class="text-xs font-semibold tracking-widest text-gold-400 uppercase">{{ brand() }}</span>
          <h2 class="mt-3 font-serif text-4xl font-bold text-white sm:text-5xl">{{ copy().events }}</h2>
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
                  <h3 class="mt-2 font-serif text-2xl font-bold text-white">{{ eventTitle(event) }}</h3>
                  @if (event.location) {
                    <p class="mt-2 text-sm text-sand/60">{{ event.location }}</p>
                  }
                  @if (eventText(event); as text) {
                    <p class="mt-3 line-clamp-4 text-sm leading-relaxed font-light text-sand/70">{{ text }}</p>
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
        <div class="mt-12 text-center">
          <a routerLink="/events" class="btn-gold-line">{{ copy().viewAll }}</a>
        </div>
      </div>
    </section>

    @if (trips().data?.length) {
      <section class="bg-navy-900 py-24 [&_a.group]:bg-navy-950">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="mx-auto mb-16 max-w-3xl text-center">
            <span class="text-xs font-semibold tracking-widest text-gold-400 uppercase">{{ brand() }}</span>
            <h2 class="mt-3 font-serif text-4xl font-bold text-white sm:text-5xl">{{ copy().journeys }}</h2>
          </div>
          <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            @for (trip of trips().data; track trip.id) {
              <app-trip-card [trip]="trip" />
            }
          </div>
          <div class="mt-12 text-center">
            <a routerLink="/trips" class="btn-gold-line">{{ copy().viewAll }}</a>
          </div>
        </div>
      </section>
    }

    @if (venues().data?.length) {
      <section class="bg-navy-950 py-24">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="mx-auto mb-16 max-w-3xl text-center">
            <span class="text-xs font-semibold tracking-widest text-gold-400 uppercase">{{ brand() }}</span>
            <h2 class="mt-3 mb-4 font-serif text-4xl font-bold text-white sm:text-5xl">{{ copy().venues }}</h2>
          </div>
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
                <h3 class="mt-2 font-serif text-xl font-bold text-white">{{ venue.name || copy().untitled }}</h3>
                @if (venue.description) {
                  <p class="mt-3 line-clamp-3 text-sm leading-relaxed font-light text-sand/60">{{ venue.description }}</p>
                }
              </a>
            }
          </div>
          <div class="mt-12 text-center">
            <a routerLink="/venues" class="btn-gold-line">{{ copy().viewAll }}</a>
          </div>
        </div>
      </section>
    }

    <app-pre-footer />

    @if (sponsors().data?.length) {
      <section class="bg-navy-900 py-16">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p class="text-center text-xs font-semibold tracking-widest text-gold-400 uppercase">{{ copy().sponsors }}</p>
          <ul class="mt-8 flex flex-wrap items-center justify-center gap-4">
            @for (sponsor of sponsors().data; track sponsor.id) {
              <li>
                <a
                  class="flex h-24 w-44 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-navy-950 p-3 transition hover:border-gold-500/40"
                  [href]="sponsorLink(sponsor.websiteUrl)"
                  [attr.target]="sponsor.websiteUrl ? '_blank' : null"
                  rel="noopener"
                >
                  @if (sponsor.logoUrl) {
                    <img [src]="sponsor.logoUrl" [alt]="sponsor.name || copy().sponsors" class="h-full w-full object-contain" />
                  } @else {
                    <span class="font-serif text-xl text-white">{{ sponsor.name || copy().untitled }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </div>
      </section>
    }



    <section class="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 py-16 text-navy-950">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 class="font-serif text-3xl font-bold sm:text-4xl">{{ brand() }}</h2>
        @if (company().data?.mission) {
          <p class="mx-auto mt-4 max-w-2xl text-sm font-medium text-navy-950/80 sm:text-base">{{ company().data?.mission }}</p>
        }
        <a routerLink="/hotels" class="mt-8 inline-flex rounded bg-navy-950 px-8 py-4 text-xs font-bold tracking-widest text-gold-400 uppercase shadow-2xl transition hover:bg-navy-900">
          {{ copy().viewHotel }}
        </a>
      </div>
    </section>
  `,
})
export class HomePage {
  private readonly profiles = inject(PublicCompanyService);
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly failedHero = signal<string | null>(null);
  protected readonly company = this.profiles.state;
  protected readonly hotels = loadOnLanguage(() => this.users.hotels());
  protected readonly venues = loadOnLanguage(() => this.users.venues());
  protected readonly trips = loadOnLanguage(() => this.users.trips());
  protected readonly events = loadOnLanguage(() => this.users.events());
  protected readonly sponsors = loadOnLanguage(() => this.users.sponsors());
  protected readonly copy = computed(() => uiCopy(this.language.code()));
  protected readonly brand = computed(() => this.company().data?.name || 'Plaza Inn');
  protected readonly hero = computed(() => {
    const src = this.company().data ? imageUrl(this.company().data!) : null;
    return src && src !== this.failedHero() ? src : null;
  });
  protected readonly film = computed(() => filmSource(this.company().data?.videoUrl));
  protected readonly fileSrc = computed(() => {
    const film = this.film();
    return film?.kind === 'file' ? film.src : null;
  });
  protected readonly hasFilm = computed(() => this.fileSrc() != null || this.embedUrl() != null);
  protected readonly embedUrl = computed((): SafeResourceUrl | null => {
    const film = this.film();
    if (!film) {
      return null;
    }
    if (film.kind === 'youtube') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${film.id}&modestbranding=1&playsinline=1&rel=0`,
      );
    }
    if (film.kind === 'vimeo') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://player.vimeo.com/video/${film.id}?autoplay=1&muted=1&loop=1&background=1`,
      );
    }
    return null;
  });
  protected readonly hasStory = computed(() => {
    const profile = this.company().data;
    return !!(profile?.aboutUs || profile?.vision || profile?.mission);
  });
  protected readonly pictures = computed(() =>
    galleryOf(this.company().data?.mediaAssets, this.hero()),
  );
  protected readonly leadPicture = computed(() => this.pictures()[0]?.fileUrl || this.hero());
  protected readonly sidePicture = computed(() => this.pictures()[1]?.fileUrl ?? null);

  protected startFilm(event: Event): void {
    const video = event.target;
    if (!(video instanceof HTMLVideoElement)) {
      return;
    }
    video.muted = true;
    void video.play();
  }

  protected venueName(type: VenueDto['venueType']): string {
    return venueTypeName(this.language.code(), type);
  }

  protected sponsorLink(url: string | null): string | null {
    return externalUrl(url);
  }

  protected venueMark(venue: VenueDto): string {
    return (venue.name || venue.venueType || 'P').trim().charAt(0);
  }

  protected eventTitle(event: EventDto): string {
    return event.title || this.copy().untitled;
  }

  protected eventText(event: EventDto): string | null {
    return event.shortDescription || event.detailedDescription || null;
  }

  protected eventImage(event: EventDto): string | null {
    return imageUrl(event);
  }

  protected eventWhen(event: EventDto): string {
    return formatEventRange(event.startDate, event.endDate, event.isAllDay, this.language.code());
  }
}
