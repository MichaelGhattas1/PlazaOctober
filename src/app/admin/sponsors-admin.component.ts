import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminBrandingService } from '../core/api/admin-branding.service';
import { MediaAssetDto, SponsorDto } from '../core/api/api.models';
import { errorMessage } from '../shared/http-error';
import { LanguageCatalog } from '../shared/language-catalog.service';
import { FileUpload } from '../shared/file-upload.component';
import { TranslationField, TranslationTabs } from '../shared/translation-tabs.component';
import { buildTranslations, emptyToNull, loadLocalized, readTranslations, translationValues } from './admin-form';

@Component({
  selector: 'app-sponsors-admin',
  imports: [ReactiveFormsModule, TranslationTabs, FileUpload],
  template: `
    @if (mode() === 'list') {
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="kicker">Marks</p>
          <h1 class="mt-2 text-6xl">Sponsors</h1>
        </div>
        <button type="button" class="btn-ink" (click)="openCreate()">Add sponsor</button>
      </div>
      <p class="mt-3 max-w-2xl text-sm text-bark">The public site shows active sponsors only. Inactive ones stay here.</p>
      @if (notice()) { <p class="mt-4 text-sm text-pine">{{ notice() }}</p> }
      @if (error()) { <p class="mt-4 text-sm text-red-800">{{ error() }}</p> }
      @if (loading()) {
        <p class="mt-8 text-bark">Loading…</p>
      } @else if (!rows().length) {
        <p class="mt-8 text-bark">No sponsors yet.</p>
      } @else {
        <div class="mt-8 grid gap-4">
          @for (row of rows(); track row.id) {
            <article class="panel flex flex-col gap-4 md:flex-row md:items-center">
              <div class="min-w-0 flex-1">
                <h2 class="text-4xl">{{ row.name || 'Untitled' }}</h2>
                <p class="mt-1 text-sm text-bark">Order {{ row.displayOrder }} · {{ row.isActive ? 'Active' : 'Hidden' }}</p>
              </div>
              <div class="flex gap-4">
                <button type="button" class="btn-quiet" (click)="openEdit(row.id)">Edit</button>
                @if (confirmingId() === row.id) {
                  <button type="button" class="btn-danger" (click)="remove(row.id)">Confirm delete</button>
                  <button type="button" class="btn-quiet" (click)="confirmingId.set(null)">Cancel</button>
                } @else {
                  <button type="button" class="btn-danger" (click)="confirmingId.set(row.id)">Delete</button>
                }
              </div>
            </article>
          }
        </div>
      }
    } @else {
      <button type="button" class="btn-quiet" (click)="cancel()">Back to sponsors</button>
      <h1 class="mt-4 text-5xl">{{ editingId() ? 'Edit sponsor' : 'New sponsor' }}</h1>
      @if (formLoading()) {
        <p class="mt-6 text-bark">Loading translations…</p>
      } @else {
        <form class="mt-6 grid gap-6" [formGroup]="form" (ngSubmit)="save()">
          @if (unverified()) {
            <p class="rounded-2xl bg-sand px-4 py-3 text-sm">Existing translations could not be matched to a language. Fill every language you want to keep before saving.</p>
          }
          @if (formError()) { <p class="text-sm text-red-800">{{ formError() }}</p> }
          <div class="grid gap-4 md:grid-cols-2">
            <label class="field"><span>Logo URL</span><input formControlName="logoUrl" maxlength="1000" /></label>
            <label class="field"><span>Website URL</span><input formControlName="websiteUrl" maxlength="1000" /></label>
            <label class="field"><span>Display order</span><input formControlName="displayOrder" type="number" /></label>
            <label class="field flex-row items-center gap-3"><input type="checkbox" formControlName="isActive" /><span>Active on the public site</span></label>
          </div>
          <app-file-upload targetEntity="Sponsor" (uploaded)="attach($event)" />
          <app-translation-tabs [fields]="fields" [array]="form.controls.translations" requiredKey="name" />
          <div class="flex gap-3">
            <button class="btn-ink" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
            <button class="btn-line" type="button" (click)="cancel()">Cancel</button>
          </div>
        </form>
      }
    }
  `,
})
export class SponsorsAdminPage {
  private readonly admin = inject(AdminBrandingService);
  private readonly catalog = inject(LanguageCatalog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private requestToken = 0;
  protected readonly fields: TranslationField[] = [
    { key: 'name', label: 'Name', maxlength: 200 },
    { key: 'description', label: 'Description', maxlength: 1000, multiline: true },
  ];
  protected readonly form = this.fb.group({
    logoUrl: this.fb.nonNullable.control(''),
    websiteUrl: this.fb.nonNullable.control(''),
    displayOrder: this.fb.nonNullable.control(0),
    isActive: this.fb.nonNullable.control(true),
    translations: this.fb.array<FormGroup>([]),
  });
  protected readonly rows = signal<SponsorDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notice = signal<string | null>(null);
  protected readonly mode = signal<'list' | 'form'>('list');
  protected readonly editingId = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly formLoading = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly unverified = signal(false);
  protected readonly confirmingId = signal<number | null>(null);

  constructor() {
    this.reload();
  }

  protected openCreate(): void {
    this.prepare();
    this.editingId.set(null);
    this.form.reset({ logoUrl: '', websiteUrl: '', displayOrder: 0, isActive: true });
    this.form.setControl('translations', buildTranslations(this.fb, this.catalog.codes(), this.fields));
    this.mode.set('form');
  }

  protected openEdit(id: number): void {
    const token = ++this.requestToken;
    this.prepare();
    this.editingId.set(id);
    this.formLoading.set(true);
    this.mode.set('form');
    loadLocalized(this.catalog.codes(), (language) => this.admin.getSponsor(id, { language }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (loaded) => {
          if (token !== this.requestToken) return;
          const base = loaded[0]?.record;
          if (!base) {
            this.formError.set('This sponsor could not be loaded.');
            this.formLoading.set(false);
            return;
          }
          const existing = translationValues(loaded, 'name', (record) => ({
            name: record.name,
            description: record.description,
          }));
          this.unverified.set(loaded.some((row) => !!row.record.name) && Object.keys(existing).length === 0);
          this.form.patchValue({
            logoUrl: base.logoUrl ?? '',
            websiteUrl: base.websiteUrl ?? '',
            displayOrder: base.displayOrder,
            isActive: base.isActive,
          });
          this.form.setControl('translations', buildTranslations(this.fb, this.catalog.codes(), this.fields, existing));
          this.formLoading.set(false);
        },
        error: (error: unknown) => {
          if (token !== this.requestToken) return;
          this.formError.set(errorMessage(error));
          this.formLoading.set(false);
        },
      });
  }

  protected save(): void {
    const translations = readTranslations(this.form.controls.translations, 'name').map((row) => ({
      languageCode: row['languageCode'] ?? '',
      name: row['name'] ?? '',
      description: row['description'],
    }));
    if (!translations.length) {
      this.formError.set('Add a name in at least one language.');
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      logoUrl: emptyToNull(raw.logoUrl),
      websiteUrl: emptyToNull(raw.websiteUrl),
      displayOrder: Number(raw.displayOrder) || 0,
      isActive: raw.isActive,
      translations,
    };
    const id = this.editingId();
    this.saving.set(true);
    const request = id ? this.admin.updateSponsor(id, body) : this.admin.createSponsor(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.mode.set('list');
        this.notice.set('Sponsor saved.');
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(errorMessage(error));
      },
    });
  }

  protected remove(id: number): void {
    this.admin.deleteSponsor(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.notice.set('Sponsor deleted.');
        this.reload();
      },
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }

  protected cancel(): void {
    this.requestToken += 1;
    this.mode.set('list');
    this.formLoading.set(false);
  }

  protected attach(asset: MediaAssetDto): void {
    if (asset.fileUrl) {
      this.form.controls.logoUrl.setValue(asset.fileUrl);
    }
  }

  private prepare(): void {
    this.notice.set(null);
    this.formError.set(null);
    this.unverified.set(false);
  }

  private reload(): void {
    this.loading.set(true);
    this.admin.listSponsors(false).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(errorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
