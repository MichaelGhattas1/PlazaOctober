import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { map, Observable, of, forkJoin } from 'rxjs';
import { LanguageCode } from '../core/api/api.models';
import { isLanguageCode } from '../core/api/language.service';
import { TranslationField } from '../shared/translation-tabs.component';

export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

export function numberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
 
export function buildTranslations(
  fb: FormBuilder,
  codes: readonly string[],
  fields: readonly TranslationField[],
  existing?: Record<string, Record<string, string | null | undefined>>,
): FormArray<FormGroup> {
  const groups = codes.map((code) => {
    const values = existing?.[code] ?? {};
    const controls: Record<string, FormControl<string>> = {
      languageCode: fb.nonNullable.control(code),
    };
    for (const field of fields) {
      controls[field.key] = fb.nonNullable.control(String(values[field.key] ?? ''));
    }
    return fb.group(controls);
  });
  return fb.array(groups);
}

export function readTranslations(
  array: FormArray,
  requiredKey: string,
): Array<Record<string, string | null>> {
  const rows: Array<Record<string, string | null>> = [];
  for (const control of array.controls) {
    const value = control.getRawValue() as Record<string, string>;
    const required = value[requiredKey]?.trim() ?? '';
    if (!required) {
      continue;
    }
    const row: Record<string, string | null> = {};
    for (const [key, raw] of Object.entries(value)) {
      if (key === 'languageCode' || key === requiredKey) {
        row[key] = String(raw).trim();
      } else {
        const trimmed = String(raw ?? '').trim();
        row[key] = trimmed ? trimmed : null;
      }
    }
    rows.push(row);
  }
  return rows;
}

export function isDirectTranslation(
  code: string,
  record: { resolvedLanguage: string | null },
): boolean {
  return !!record.resolvedLanguage && record.resolvedLanguage.toLowerCase() === code.toLowerCase();
}

export function translationValues<T extends { resolvedLanguage: string | null }>(
  rows: { code: string; record: T }[],
  requiredKey: string,
  pick: (record: T) => Record<string, string | null | undefined>,
): Record<string, Record<string, string>> {
  const existing: Record<string, Record<string, string>> = {};
  for (const row of rows) {
    if (!isDirectTranslation(row.code, row.record)) {
      continue;
    }
    const picked = pick(row.record);
    if (!picked[requiredKey]?.trim()) {
      continue;
    }
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(picked)) {
      values[key] = value ?? '';
    }
    existing[row.code] = values;
  }
  return existing;
}

export function loadLocalized<T>(
  codes: readonly string[],
  load: (language: LanguageCode) => Observable<T>,
): Observable<{ code: string; record: T }[]> {
  const usable = codes.filter(isLanguageCode);
  if (!usable.length) {
    return of([]);
  }
  return forkJoin(usable.map((code) => load(code).pipe(map((record) => ({ code, record })))));
}

export function appendMediaId(current: string, id: number): string {
  const trimmed = current.trim();
  return trimmed ? `${trimmed},${id}` : String(id);
}
