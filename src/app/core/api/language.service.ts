import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { LANGUAGE_CODES, LanguageCode } from './api.models';

const STORAGE_KEY = 'plaza-language';

export function isLanguageCode(code: string): code is LanguageCode {
  return (LANGUAGE_CODES as readonly string[]).includes(code);
}

function storedLanguage(): LanguageCode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value && isLanguageCode(value)) {
      return value;
    }
  } catch {
    /* Storage can be blocked. The site still defaults to English. */
  }
  return 'en';
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly selected = signal<LanguageCode>(storedLanguage());

  readonly code = this.selected.asReadonly();

  constructor() {
    effect(() => {
      const code = this.selected();
      this.document.documentElement.lang = code;
      this.document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* Ignore private-mode storage failures. */
      }
    });
  }

  use(code: LanguageCode): void {
    this.selected.set(code);
  }
}
