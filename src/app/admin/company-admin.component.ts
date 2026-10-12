import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { AdminBrandingService } from '../core/api/admin-branding.service';
import { CompanyProfileDto, MediaAssetDto } from '../core/api/api.models';
import { LanguageCatalog } from '../shared/language-catalog.service';
import { errorMessage } from '../shared/http-error';
import { FileUpload } from '../shared/file-upload.component';
import { TranslationField, TranslationTabs } from '../shared/translation-tabs.component';
import { appendMediaId, buildTranslations, emptyToNull, loadLocalized, readTranslations, translationValues } from './admin-form';

@Component({
  selector: 'app-company-admin',
  imports: [ReactiveFormsModule, TranslationTabs, FileUpload],
  template: `
    @if (mode() === 'list') {
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="kicker">Public profile</p>
          <h1 class="mt-2 text-6xl">Company</h1>
        </div>
        <button type="button" class="btn-ink" (click)="openCreate()">Add profile</button>
      </div>
      @if (notice()) { <p class="mt-4 text-sm text-pine">{{ notice() }}</p> }
      @if (error()) { <p class="mt-4 text-sm text-red-800">{{ error() }}</p> }
      @if (loading()) {
        <p class="mt-8 text-bark">Loading…</p>
      } @else if (!rows().length) {
        <p class="mt-8 text-bark">No company profile yet. The public home reads the current profile.</p>
      } @else {
        <div class="mt-8 grid gap-4">
          @for (row of rows(); track row.id) {
            <article class="panel flex flex-col gap-4 md:flex-row md:items-center">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-3">
                  <h2 class="text-4xl">{{ row.name || 'Untitled' }}</h2>
                  @if (row.id === currentId()) {
                    <span class="rounded-full bg-pine px-3 py-1 text-xs text-cream">Current</span>
                  }
                </div>
                <p class="mt-2 line-clamp-2 text-sm text-bark">{{ row.aboutUs }}</p>
              </div>
              <div class="flex flex-wrap gap-4">
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
      <button type="button" class="btn-quiet" (click)="cancel()">Back to profiles</button>
      <h1 class="mt-4 text-5xl">{{ editingId() ? 'Edit profile' : 'New profile' }}</h1>
      @if (formLoading()) {
        <p class="mt-6 text-bark">Loading translations…</p>
      } @else {
        <form class="mt-6 grid gap-6" [formGroup]="form" (ngSubmit)="save()">
          @if (unverified()) {
            <p class="rounded-2xl bg-sand px-4 py-3 text-sm">
              Existing translations could not be matched to a language. Fill every language you want to keep before saving.
            </p>
          }
          @if (formError()) { <p class="text-sm text-red-800">{{ formError() }}</p> }
          <div class="grid gap-4 md:grid-cols-2">
            <label class="field"><span>Hero image URL</span><input formControlName="heroImageUrl" maxlength="1000" /></label>
            <label class="field"><span>Video URL</span><input formControlName="videoUrl" maxlength="1000" /></label>
            <label class="field md:col-span-2"><span>Media asset ids</span><input formControlName="mediaAssetIds" maxlength="2000" /></label>
          </div>
          <app-file-upload targetEntity="CompanyProfile" (uploaded)="attach($event)" />
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
export class CompanyAdminPage {
  private readonly admin = inject(AdminBrandingService);
  private readonly catalog = inject(LanguageCatalog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private requestToken = 0;

  protected readonly fields: TranslationField[] = [
    { key: 'name', label: 'Name', maxlength: 200 },
    { key: 'aboutUs', label: 'About', multiline: true },
    { key: 'vision', label: 'Vision', multiline: true },
    { key: 'mission', label: 'Mission', multiline: true },
  ];
  protected readonly form = this.fb.group({
    heroImageUrl: this.fb.nonNullable.control(''),
    videoUrl: this.fb.nonNullable.control(''),
    mediaAssetIds: this.fb.nonNullable.control(''),
    translations: this.fb.array<FormGroup>([]),
  });
  protected readonly rows = signal<CompanyProfileDto[]>([]);
  protected readonly currentId = signal<number | null>(null);
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
    this.notice.set(null);
    this.formError.set(null);
    this.unverified.set(false);
    this.editingId.set(null);
    this.form.patchValue({ heroImageUrl: '', videoUrl: '', mediaAssetIds: '' });
    this.form.setControl('translations', buildTranslations(this.fb, this.catalog.codes(), this.fields));
    this.mode.set('form');
  }

  protected openEdit(id: number): void {
    const token = ++this.requestToken;
    this.notice.set(null);
    this.formError.set(null);
    this.editingId.set(id);
    this.formLoading.set(true);
    this.mode.set('form');
    loadLocalized(this.catalog.codes(), (language) => this.admin.getCompany(id, { language }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          if (token !== this.requestToken) return;
          const base = rows[0]?.record;
          if (!base) {
            this.formError.set('This profile could not be loaded.');
            this.formLoading.set(false);
            return;
          }
          const existing = translationValues(rows, 'name', (record) => ({
            name: record.name,
            aboutUs: record.aboutUs,
            vision: record.vision,
            mission: record.mission,
          }));
          this.unverified.set(rows.some((row) => !!row.record.name) && Object.keys(existing).length === 0);
          this.form.patchValue({
            heroImageUrl: base.heroImageUrl ?? '',
            videoUrl: base.videoUrl ?? '',
            mediaAssetIds: base.mediaAssetIds ?? '',
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
      aboutUs: row['aboutUs'],
      vision: row['vision'],
      mission: row['mission'],
    }));
    if (!translations.length) {
      this.formError.set('Add a name in at least one language.');
      return;
    }
    const raw = this.form.getRawValue();
    const body = {
      heroImageUrl: emptyToNull(raw.heroImageUrl),
      videoUrl: emptyToNull(raw.videoUrl),
      mediaAssetIds: emptyToNull(raw.mediaAssetIds),
      translations,
    };
    const id = this.editingId();
    this.saving.set(true);
    this.formError.set(null);
    const request = id ? this.admin.updateCompany(id, body) : this.admin.createCompany(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.mode.set('list');
        this.notice.set('Company profile saved.');
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(errorMessage(error));
      },
    });
  }

  protected remove(id: number): void {
    this.admin.deleteCompany(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.notice.set('Company profile deleted.');
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
    if (asset.fileUrl && asset.category === 'Video') {
      this.form.controls.videoUrl.setValue(asset.fileUrl);
    } else if (asset.fileUrl && !this.form.controls.heroImageUrl.value) {
      this.form.controls.heroImageUrl.setValue(asset.fileUrl);
    }
    this.form.controls.mediaAssetIds.setValue(
      appendMediaId(this.form.controls.mediaAssetIds.value, asset.id),
    );
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      rows: this.admin.listCompanies(),
      current: this.admin.currentCompany().pipe(catchError(() => of(null))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ rows, current }) => {
          this.rows.set(rows);
          this.currentId.set(current?.id ?? null);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(errorMessage(error));
          this.loading.set(false);
        },
      });
  }
}
