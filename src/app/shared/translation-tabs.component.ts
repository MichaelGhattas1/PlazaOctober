import { Component, effect, inject, input, signal } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { LanguageService } from '../core/api/language.service';
import { LanguageCatalog } from './language-catalog.service';

export interface TranslationField {
  key: string;
  label: string;
  multiline?: boolean;
  maxlength?: number;
}

@Component({
  selector: 'app-translation-tabs',
  imports: [ReactiveFormsModule],
  template: `
    <div class="grid gap-4">
      <div class="flex flex-wrap gap-2" role="tablist" aria-label="Languages">
        @for (group of array().controls; track codeOf(group)) {
          <button
            type="button"
            role="tab"
            class="rounded-full border px-3 py-1.5 text-sm"
            [class.border-ink]="selected() === codeOf(group)"
            [class.bg-ink]="selected() === codeOf(group)"
            [class.text-cream]="selected() === codeOf(group)"
            [class.border-sand]="selected() !== codeOf(group)"
            [attr.aria-selected]="selected() === codeOf(group)"
            (click)="selected.set(codeOf(group))"
          >
            {{ catalog.nativeName(codeOf(group)) }}
          </button>
        }
      </div>
      <p class="text-sm text-bark">
        A language is saved only when its {{ requiredKey() === 'title' ? 'title' : 'name' }} is filled
        in. A blank language is removed from the record.
      </p>
      @for (group of array().controls; track codeOf(group)) {
        <div
          class="grid gap-4 md:grid-cols-2"
          [formGroup]="asGroup(group)"
          [hidden]="selected() !== codeOf(group)"
          [attr.lang]="codeOf(group)"
          [attr.dir]="codeOf(group) === 'ar' ? 'rtl' : 'ltr'"
        >
          @for (field of fields(); track field.key) {
            <label class="field" [class.md:col-span-2]="field.multiline">
              <span>
                {{ field.label }}
                @if (field.key === requiredKey()) {
                  <span class="text-gold">*</span>
                }
              </span>
              @if (field.multiline) {
                <textarea
                  rows="5"
                  [formControlName]="field.key"
                  [attr.maxlength]="field.maxlength ?? null"
                ></textarea>
              } @else {
                <input [formControlName]="field.key" [attr.maxlength]="field.maxlength ?? null" />
              }
            </label>
          }
        </div>
      }
    </div>
  `,
})
export class TranslationTabs {
  readonly fields = input.required<TranslationField[]>();
  readonly array = input.required<FormArray<FormGroup>>();
  readonly requiredKey = input('name');

  protected readonly catalog = inject(LanguageCatalog);
  private readonly language = inject(LanguageService);
  protected readonly selected = signal('');

  constructor() {
    effect(() => {
      const codes = this.array().controls.map((group) => this.codeOf(group));
      const current = this.selected();
      if (codes.includes(current)) {
        return;
      }
      const preferred = this.language.code();
      this.selected.set(codes.includes(preferred) ? preferred : (codes[0] ?? ''));
    });
  }

  protected codeOf(group: FormGroup): string {
    return String(group.get('languageCode')?.value ?? '');
  }

  protected asGroup(group: FormGroup): FormGroup {
    return group;
  }
}
