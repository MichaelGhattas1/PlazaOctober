import { Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
import { LanguageDto } from '../core/api/api.models';
import { isLanguageCode, LanguageService } from '../core/api/language.service';
import { LanguageCatalog } from './language-catalog.service';

@Component({
  selector: 'app-language-switch',
  template: `
    <div class="relative">
      <button
        type="button"
        class="flex items-center gap-2 rounded-full border border-gold-500/40 px-3 py-1.5 text-[11px] tracking-wide text-sand transition hover:border-gold-400 hover:text-gold-300"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
        aria-label="Language"
        (click)="open.update((value) => !value)"
      >
        <span>{{ currentLabel() }}</span>
        <svg class="h-3 w-3 transition" [class.rotate-180]="open()" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
      </button>
      @if (open()) {
        <ul
          class="absolute end-0 z-50 mt-2 min-w-40 overflow-hidden rounded-lg border border-gold-500/30 bg-navy-900 py-1 shadow-xl"
          role="listbox"
          aria-label="Language"
        >
          @for (language of catalog.list(); track language.id) {
            <li role="presentation">
              <button
                type="button"
                class="block w-full px-4 py-2 text-start text-xs tracking-wide text-sand transition hover:bg-white/5 hover:text-gold-300"
                role="option"
                [attr.aria-selected]="active(language)"
                [class.text-gold-400]="active(language)"
                [class.font-semibold]="active(language)"
                (click)="choose(language)"
              >
                {{ language.nativeName || language.code }}
              </button>
            </li>
          }
        </ul>
      }
    </div>
  `,
})
export class LanguageSwitch {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly catalog = inject(LanguageCatalog);
  private readonly language = inject(LanguageService);
  protected readonly open = signal(false);
  private readonly current = computed(() => this.language.code());
  protected readonly currentLabel = computed(() => this.catalog.nativeName(this.current()));

  protected active(language: LanguageDto): boolean {
    return language.code === this.current();
  }

  protected choose(language: LanguageDto): void {
    if (language.code && isLanguageCode(language.code)) {
      this.language.use(language.code);
    }
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected closeOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected close(): void {
    this.open.set(false);
  }
}
