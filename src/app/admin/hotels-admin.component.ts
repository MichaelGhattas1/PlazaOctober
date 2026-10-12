import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminBrandingService } from '../core/api/admin-branding.service';
import { HotelDto, MediaAssetDto } from '../core/api/api.models';
import { errorMessage } from '../shared/http-error';
import { LanguageCatalog } from '../shared/language-catalog.service';
import { FileUpload } from '../shared/file-upload.component';
import { TranslationField, TranslationTabs } from '../shared/translation-tabs.component';
import {
  appendMediaId,
  buildTranslations,
  emptyToNull,
  loadLocalized,
  numberOrNull,
  readTranslations,
  translationValues,
} from './admin-form';

@Component({
  selector: 'app-hotels-admin',
  imports: [ReactiveFormsModule, TranslationTabs, FileUpload],
  template: `
    @if (mode() === 'list') {
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="kicker">Collection</p>
          <h1 class="mt-2 text-6xl">Hotels</h1>
        </div>
        <button type="button" class="btn-ink" (click)="openCreate()">Add hotel</button>
      </div>
      @if (notice()) { <p class="mt-4 text-sm text-pine">{{ notice() }}</p> }
      @if (error()) { <p class="mt-4 text-sm text-red-800">{{ error() }}</p> }
      @if (loading()) {
        <p class="mt-8 text-bark">Loading…</p>
      } @else if (!rows().length) {
        <p class="mt-8 text-bark">No hotels yet.</p>
      } @else {
        <div class="mt-8 grid gap-4">
          @for (row of rows(); track row.id) {
            <article class="panel flex flex-col gap-4 md:flex-row md:items-center">
              <div class="min-w-0 flex-1">
                <h2 class="text-4xl">{{ row.name || 'Untitled' }}</h2>
                <p class="mt-1 text-sm text-bark">{{ row.starRating }}★ · {{ row.city }} {{ row.country }}</p>
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
      <button type="button" class="btn-quiet" (click)="cancel()">Back to hotels</button>
      <h1 class="mt-4 text-5xl">{{ editingId() ? 'Edit hotel' : 'New hotel' }}</h1>
      @if (formLoading()) {
        <p class="mt-6 text-bark">Loading translations…</p>
      } @else {
        <form class="mt-6 grid gap-6" [formGroup]="form" (ngSubmit)="save()">
          @if (unverified()) {
            <p class="rounded-2xl bg-sand px-4 py-3 text-sm">Existing translations could not be matched to a language. Fill every language you want to keep before saving.</p>
          }
          @if (formError()) { <p class="text-sm text-red-800">{{ formError() }}</p> }
          <div class="grid gap-4 md:grid-cols-2">
            <label class="field"><span>Stars</span>
              <select formControlName="starRating">
                @for (star of starChoices; track star) { <option [ngValue]="star">{{ star }}</option> }
              </select>
            </label>
            <label class="field"><span>Phone</span><input formControlName="phone" maxlength="32" /></label>
            <label class="field"><span>Email</span><input formControlName="email" type="email" maxlength="256" /></label>
            <label class="field"><span>City</span><input formControlName="city" maxlength="120" /></label>
            <label class="field"><span>Country</span><input formControlName="country" maxlength="120" /></label>
            <label class="field md:col-span-2"><span>Address</span><input formControlName="address" maxlength="500" /></label>
            <label class="field"><span>Latitude</span><input formControlName="latitude" type="number" step="any" /></label>
            <label class="field"><span>Longitude</span><input formControlName="longitude" type="number" step="any" /></label>
            <label class="field md:col-span-2"><span>Cover image URL</span><input formControlName="coverImageUrl" maxlength="1000" /></label>
            <label class="field md:col-span-2"><span>Media asset ids</span><input formControlName="mediaAssetIds" maxlength="2000" /></label>
          </div>
          <app-file-upload targetEntity="Hotel" (uploaded)="attach($event)" />
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
export class HotelsAdminPage {
  private readonly admin = inject(AdminBrandingService);
  private readonly catalog = inject(LanguageCatalog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private requestToken = 0;
  protected readonly starChoices = [1, 2, 3, 4, 5];
  protected readonly fields: TranslationField[] = [
    { key: 'name', label: 'Name', maxlength: 200 },
    { key: 'shortDescription', label: 'Short description', maxlength: 500, multiline: true },
    { key: 'detailedDescription', label: 'Detailed description', multiline: true },
  ];
  protected readonly form = this.fb.group({
    starRating: this.fb.nonNullable.control(5),
    phone: this.fb.nonNullable.control(''),
    email: this.fb.nonNullable.control(''),
    address: this.fb.nonNullable.control(''),
    city: this.fb.nonNullable.control(''),
    country: this.fb.nonNullable.control(''),
    latitude: this.fb.control<number | null>(null),
    longitude: this.fb.control<number | null>(null),
    coverImageUrl: this.fb.nonNullable.control(''),
    mediaAssetIds: this.fb.nonNullable.control(''),
    translations: this.fb.array<FormGroup>([]),
  });
  protected readonly rows = signal<HotelDto[]>([]);
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
    this.form.reset({
      starRating: 5,
      phone: '',
      email: '',
      address: '',
      city: '',
      country: '',
      latitude: null,
      longitude: null,
      coverImageUrl: '',
      mediaAssetIds: '',
    });
    this.form.setControl('translations', buildTranslations(this.fb, this.catalog.codes(), this.fields));
    this.mode.set('form');
  }

  protected openEdit(id: number): void {
    const token = ++this.requestToken;
    this.prepare();
    this.editingId.set(id);
    this.formLoading.set(true);
    this.mode.set('form');
    loadLocalized(this.catalog.codes(), (language) => this.admin.getHotel(id, { language }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (loaded) => {
          if (token !== this.requestToken) return;
          const base = loaded[0]?.record;
          if (!base) {
            this.formError.set('This hotel could not be loaded.');
            this.formLoading.set(false);
            return;
          }
          const existing = translationValues(loaded, 'name', (record) => ({
            name: record.name,
            shortDescription: record.shortDescription,
            detailedDescription: record.detailedDescription,
          }));
          this.unverified.set(loaded.some((row) => !!row.record.name) && Object.keys(existing).length === 0);
          this.form.patchValue({
            starRating: base.starRating || 5,
            phone: base.phone ?? '',
            email: base.email ?? '',
            address: base.address ?? '',
            city: base.city ?? '',
            country: base.country ?? '',
            latitude: base.latitude,
            longitude: base.longitude,
            coverImageUrl: base.coverImageUrl ?? '',
            mediaAssetIds: base.mediaAssetIds ?? '',
          });
          this.form.setControl('translations', buildTranslations(this.fb, this.catalog.codes(), this.fields, existing));
          this.formLoading.set(false);
        },
        error: (error: unknown) => this.failLoad(token, error),
      });
  }

  protected save(): void {
    const translations = readTranslations(this.form.controls.translations, 'name').map((row) => ({
      languageCode: row['languageCode'] ?? '',
      name: row['name'] ?? '',
      shortDescription: row['shortDescription'],
      detailedDescription: row['detailedDescription'],
    }));
    if (!translations.length) {
      this.formError.set('Add a name in at least one language.');
      return;
    }
    const raw = this.form.getRawValue();
    const latitude = numberOrNull(raw.latitude);
    const longitude = numberOrNull(raw.longitude);
    if (raw.latitude != null && latitude == null) {
      this.formError.set('Latitude must be a number.');
      return;
    }
    if (latitude != null && (latitude < -90 || latitude > 90)) {
      this.formError.set('Latitude must be between -90 and 90.');
      return;
    }
    if (longitude != null && (longitude < -180 || longitude > 180)) {
      this.formError.set('Longitude must be between -180 and 180.');
      return;
    }
    const body = {
      starRating: raw.starRating,
      phone: emptyToNull(raw.phone),
      email: emptyToNull(raw.email),
      address: emptyToNull(raw.address),
      city: emptyToNull(raw.city),
      country: emptyToNull(raw.country),
      latitude,
      longitude,
      coverImageUrl: emptyToNull(raw.coverImageUrl),
      mediaAssetIds: emptyToNull(raw.mediaAssetIds),
      translations,
    };
    const id = this.editingId();
    this.saving.set(true);
    const request = id ? this.admin.updateHotel(id, body) : this.admin.createHotel(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.saved('Hotel saved.'),
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(errorMessage(error));
      },
    });
  }

  protected remove(id: number): void {
    this.admin.deleteHotel(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.notice.set('Hotel deleted.');
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
    if (asset.fileUrl && asset.category !== 'Video' && !this.form.controls.coverImageUrl.value) {
      this.form.controls.coverImageUrl.setValue(asset.fileUrl);
    }
    this.form.controls.mediaAssetIds.setValue(appendMediaId(this.form.controls.mediaAssetIds.value, asset.id));
  }

  private prepare(): void {
    this.notice.set(null);
    this.formError.set(null);
    this.unverified.set(false);
  }

  private saved(message: string): void {
    this.saving.set(false);
    this.mode.set('list');
    this.notice.set(message);
    this.reload();
  }

  private failLoad(token: number, error: unknown): void {
    if (token !== this.requestToken) return;
    this.formError.set(errorMessage(error));
    this.formLoading.set(false);
  }

  private reload(): void {
    this.loading.set(true);
    this.admin.listHotels().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
