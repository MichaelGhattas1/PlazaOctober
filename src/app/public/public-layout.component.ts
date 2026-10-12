import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { LanguageService } from '../core/api/language.service';
import { LanguageSwitch } from '../shared/language-switch.component';
import { uiCopy } from '../shared/ui-copy';
import { PublicCompanyService } from './public-company.service';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LanguageSwitch],
  template: `
    <div class="flex min-h-screen flex-col">
      <div class="border-b border-gold-500/20 bg-navy-900 px-4 py-2 text-center text-[11px] font-light tracking-[0.28em] text-gold-300 uppercase">
        {{ brand() }}
      </div>

      <header class="glass-nav sticky top-0 z-40 border-b border-white/10">
        <div class="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-8">
          <a routerLink="/" class="flex items-center gap-2.5">
            <img src="logo-mark.png" alt="" class="h-12 w-auto" />
            <img src="logo-type.png" [alt]="brand()" class="h-6 w-auto sm:h-7" />
          </a>

          <nav class="hidden items-center gap-8 text-xs font-medium tracking-[0.2em] text-sand/80 uppercase lg:flex">
            <a routerLink="/" routerLinkActive="text-gold-400" [routerLinkActiveOptions]="{ exact: true }" class="transition hover:text-gold-400">{{ copy().home }}</a>
            <a routerLink="/hotels" routerLinkActive="text-gold-400" class="transition hover:text-gold-400">{{ copy().hotels }}</a>
            <a routerLink="/trips" routerLinkActive="text-gold-400" class="transition hover:text-gold-400">{{ copy().journeys }}</a>
            <a routerLink="/events" routerLinkActive="text-gold-400" class="transition hover:text-gold-400">{{ copy().events }}</a>
            <a routerLink="/house" routerLinkActive="text-gold-400" class="transition hover:text-gold-400">{{ copy().house }}</a>
            <a routerLink="/" fragment="contact" class="transition hover:text-gold-400" (click)="goContact()">{{ copy().contactUs }}</a>
          </nav>

          <div class="hidden items-center gap-4 md:flex">
            <app-language-switch />
            <a routerLink="/hotels" class="btn-gold">{{ copy().hotels }}</a>
          </div>

          <button
            type="button"
            class="grid gap-1.5 p-2 text-sand md:hidden"
            [attr.aria-expanded]="menuOpen()"
            [attr.aria-label]="menuOpen() ? copy().close : copy().menu"
            (click)="menuOpen.set(!menuOpen())"
          >
            <span class="block h-0.5 w-5 bg-current"></span>
            <span class="block h-0.5 w-5 bg-current"></span>
            <span class="block h-0.5 w-5 bg-current"></span>
          </button>
        </div>

        @if (menuOpen()) {
          <nav class="space-y-1 border-t border-gold-500/20 bg-navy-900 px-6 py-6 md:hidden">
            <a routerLink="/" class="block border-b border-white/5 py-3 text-sm tracking-wider text-sand uppercase" routerLinkActive="text-gold-400" [routerLinkActiveOptions]="{ exact: true }">{{ copy().home }}</a>
            <a routerLink="/hotels" class="block border-b border-white/5 py-3 text-sm tracking-wider text-sand uppercase" routerLinkActive="text-gold-400">{{ copy().hotels }}</a>
            <a routerLink="/trips" class="block border-b border-white/5 py-3 text-sm tracking-wider text-sand uppercase" routerLinkActive="text-gold-400">{{ copy().journeys }}</a>
            <a routerLink="/events" class="block border-b border-white/5 py-3 text-sm tracking-wider text-sand uppercase" routerLinkActive="text-gold-400">{{ copy().events }}</a>
            <a routerLink="/house" class="block border-b border-white/5 py-3 text-sm tracking-wider text-sand uppercase" routerLinkActive="text-gold-400">{{ copy().house }}</a>
            <a routerLink="/" fragment="contact" class="block border-b border-white/5 py-3 text-sm tracking-wider text-sand uppercase" (click)="goContact()">{{ copy().contactUs }}</a>
            <a routerLink="/admin" class="block py-3 text-sm tracking-wider text-sand/60 uppercase">{{ copy().admin }}</a>
            <div class="pt-3">
              <app-language-switch />
            </div>
          </nav>
        }
      </header>

      <main class="flex-1">
        <router-outlet />
      </main>

      <footer class="border-t border-white/10 bg-navy-950 pt-16 pb-12 text-sand/60">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="mb-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <img src="logo-lockup.png" [alt]="brand()" class="mb-6 h-36 w-auto" />
              <p class="line-clamp-5 max-w-sm text-xs leading-relaxed font-light">{{ footer() }}</p>
            </div>
            <div>
              <h2 class="mb-4 font-serif text-sm font-bold tracking-wider text-white uppercase">{{ copy().explore }}</h2>
              <ul class="space-y-2.5 text-xs">
                <li><a routerLink="/" class="transition hover:text-gold-400">{{ copy().home }}</a></li>
                <li><a routerLink="/hotels" class="transition hover:text-gold-400">{{ copy().hotels }}</a></li>
                <li><a routerLink="/trips" class="transition hover:text-gold-400">{{ copy().journeys }}</a></li>
                <li><a routerLink="/events" class="transition hover:text-gold-400">{{ copy().events }}</a></li>
                <li><a routerLink="/house" class="transition hover:text-gold-400">{{ copy().house }}</a></li>
                <li><a routerLink="/" fragment="contact" class="transition hover:text-gold-400">{{ copy().contactUs }}</a></li>
              </ul>
            </div>
            <div>
              <h2 class="mb-4 font-serif text-sm font-bold tracking-wider text-white uppercase">{{ copy().house }}</h2>
              <a routerLink="/admin" class="text-xs tracking-wider uppercase transition hover:text-gold-400">{{ copy().admin }}</a>
            </div>
          </div>
          <div class="border-t border-white/10 pt-8 text-xs text-sand/40">
            <p>{{ brand() }}</p>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class PublicLayout {
  private readonly company = inject(PublicCompanyService);
  private readonly language = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly menuOpen = signal(false);
  protected readonly copy = computed(() => uiCopy(this.language.code()));
  protected readonly brand = computed(() => this.company.state().data?.name || 'Plaza Inn');
  protected readonly footer = computed(
    () => this.company.state().data?.aboutUs || this.copy().footerNote,
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.menuOpen.set(false);
        if (this.router.parseUrl(this.router.url).fragment === 'contact') {
          this.scrollToContact();
        }
      });
  }

  protected goContact(): void {
    this.menuOpen.set(false);
    this.scrollToContact();
  }

  private scrollToContact(): void {
    const started = performance.now();
    const run = () => {
      const target = document.getElementById('contact');
      if (target && target.getBoundingClientRect().top > 180) {
        const root = document.documentElement;
        const previous = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        target.scrollIntoView({ block: 'start' });
        root.style.scrollBehavior = previous;
      }
      if (performance.now() - started < 1500) {
        setTimeout(run, 50);
      }
    };
    setTimeout(run, 0);
  }
}
