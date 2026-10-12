import { inject, Injectable, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { LanguageDto } from '../core/api/api.models';
import { UserBrandingService } from '../core/api/user-branding.service';

const fallbackLanguages: LanguageDto[] = [
  { id: 1, code: 'ar', name: 'Arabic', nativeName: 'العربية', isDefault: false, displayOrder: 1 },
  { id: 2, code: 'en', name: 'English', nativeName: 'English', isDefault: true, displayOrder: 2 },
  { id: 3, code: 'fr', name: 'French', nativeName: 'Français', isDefault: false, displayOrder: 3 },
  { id: 4, code: 'zh', name: 'Chinese', nativeName: '中文', isDefault: false, displayOrder: 4 },
  { id: 5, code: 'es', name: 'Spanish', nativeName: 'Español', isDefault: false, displayOrder: 5 },
];

@Injectable({ providedIn: 'root' })
export class LanguageCatalog {
  private readonly loaded = toSignal(
    inject(UserBrandingService)
      .languages()
      .pipe(
        map((list) => [...list].sort((a, b) => a.displayOrder - b.displayOrder)),
        catchError(() => of(fallbackLanguages)),
      ),
    { initialValue: fallbackLanguages },
  );

  readonly list = computed(() => {
    const languages = this.loaded();
    return languages.length ? languages : fallbackLanguages;
  });

  readonly codes = computed(() =>
    this.list()
      .map((language) => language.code)
      .filter((code): code is string => !!code),
  );

  nativeName(code: string): string {
    return this.list().find((language) => language.code === code)?.nativeName || code.toUpperCase();
  }
}
