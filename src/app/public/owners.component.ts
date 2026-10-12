import { Component, computed, inject, signal } from '@angular/core';
import { OwnerDto } from '../core/api/api.models';
import { LanguageService } from '../core/api/language.service';
import { UserBrandingService } from '../core/api/user-branding.service';
import { imageUrl } from '../shared/format';
import { loadOnLanguage } from '../shared/load';
import { uiCopy } from '../shared/ui-copy';

@Component({
  selector: 'app-owners',
  template: `
    <section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div class="mx-auto mb-16 max-w-3xl text-center">
        <p class="kicker">Plaza Inn</p>
        <h1 class="mt-3 font-serif text-5xl text-white md:text-6xl">{{ copy().house }}</h1>
      </div>
      @if (owners().status === 'loading') {
        <p class="text-center text-sand/60">{{ copy().loading }}</p>
      } @else if (owners().status === 'error') {
        <p class="text-center text-sand/60">{{ owners().error }}</p>
      } @else if (owners().data?.length) {
        <div class="grid gap-8 lg:grid-cols-2">
          @for (owner of owners().data; track owner.id) {
            <article class="grid gap-5 rounded-xl border border-white/10 bg-navy-900 p-6 sm:grid-cols-[160px_1fr]">
              <div class="aspect-square overflow-hidden rounded-lg border border-gold-500/30 bg-navy-950">
                @if (photo(owner); as src) {
                  <img [src]="src" [alt]="owner.name || copy().untitled" class="h-full w-full object-cover" (error)="hide(src)" />
                }
              </div>
              <div>
                <h2 class="font-serif text-3xl text-white">{{ owner.name || copy().untitled }}</h2>
                @if (owner.nationality) {
                  <p class="mt-1 text-sm text-gold-400">{{ owner.nationality }}</p>
                }
                @if (owner.bio) {
                  <p class="mt-4 leading-7 font-light whitespace-pre-line text-sand/70">{{ owner.bio }}</p>
                }
                <div class="mt-4 grid gap-1 text-sm text-gold-300">
                  @if (owner.email) {
                    <a [href]="'mailto:' + owner.email">{{ owner.email }}</a>
                  }
                  @if (owner.phone) {
                    <a [href]="'tel:' + owner.phone">{{ owner.phone }}</a>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <p class="text-center text-sand/60">{{ copy().noOwners }}</p>
      }
    </section>
  `,
})
export class OwnersPage {
  private readonly users = inject(UserBrandingService);
  private readonly language = inject(LanguageService);
  private readonly failed = signal<string | null>(null);
  protected readonly owners = loadOnLanguage(() => this.users.owners());
  protected readonly copy = computed(() => uiCopy(this.language.code()));

  protected photo(owner: OwnerDto): string | null {
    const src = imageUrl(owner);
    return src && src !== this.failed() ? src : null;
  }

  protected hide(src: string): void {
    this.failed.set(src);
  }
}
