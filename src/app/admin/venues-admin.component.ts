import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminBrandingService } from '../core/api/admin-branding.service';
import { HotelDto, MediaAssetDto, VENUE_TYPES, VenueDto, VenueType } from '../core/api/api.models';
import { errorMessage } from '../shared/http-error';
import { LanguageCatalog } from '../shared/language-catalog.service';
import { FileUpload } from '../shared/file-upload.component';
import { TranslationField, TranslationTabs } from '../shared/translation-tabs.component';
import {
  appendMediaId,
  buildTranslations,
  emptyToNull,
  loadLocalized,
  readTranslations,
  translationValues,
} from './admin-form';

@Component({
  selector: 'app-venues-admin',
  imports: [ReactiveFormsModule, TranslationTabs, FileUpload],
  template: `
    @if (mode() === 'list') {
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="kicker">Inside the hotels</p>
          <h1 class="mt-2 text-6xl">Venues</h1>
        </div>
        <button type="button" class="btn-ink" (click)="openCreate()">Add venue</button>
      </div>
      @if (notice()) { <p class="mt-4 text-sm text-pine">{{ notice() }}</p> }
      @if (error()) { <p class="mt-4 text-sm text-red-800">{{ error() }}</p> }
      @if (loading()) {
        <p class="mt-8 text-bark">Loading…</p>
      } @else if (!rows().length) {
        <p class="mt-8 text-bark">No venues yet.</p>
      } @else {
        <div class="mt-8 grid gap-4">
          @for (row of rows(); track row.id) {
            <article class="panel flex flex-col gap-4 md:flex-row md:items-center">
              <div class="min-w-0 flex-1">
                <p class="text-sm text-gold">{{ row.venueType }} · {{ hotelName(row.hotelId) }}</p>
                <h2 class="text-4xl">{{ row.name || 'Untitled' }}</h2>
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
      <button type="button" class="btn-quiet" (click)="cancel()">Back to venues</button>
      <h1 class="mt-4 text-5xl">{{ editingId() ? 'Edit venue' : 'New venue' }}</h1>
      @if (!hotels().length) {
        <p class="mt-4 text-bark">Create a hotel before adding a venue.</p>
      }
      @if (formLoading()) {
        <p class="mt-6 text-bark">Loading translations…</p>
      } @else {
        <form class="mt-6 grid gap-6" [formGroup]="form" (ngSubmit)="save()">
          @if (unverified()) {
            <p class="rounded-2xl bg-sand px-4 py-3 text-sm">Existing translations could not be matched to a language. Fill every language you want to keep before saving.</p>
          }
          @if (formError()) { <p class="text-sm text-red-800">{{ formError() }}</p> }
          <div class="grid gap-4 md:grid-cols-2">
            <label class="field"><span>Hotel</span>
              <select formControlName="hotelId">
                <option [ngValue]="null">Select a hotel</option>
                @for (hotel of hotels(); track hotel.id) {
                  <option [ngValue]="hotel.id">{{ hotel.name || 'Hotel ' + hotel.id }}</option>
                }
              </select>
            </label>
            <label class="field"><span>Type</span>
              <select formControlName="venueType">
                @for (type of venueTypes; track type) { <option [ngValue]="type">{{ type }}</option> }
              </select>
            </label>
            <label class="field"><span>Opening hours</span><input formControlName="openingHours" maxlength="200" /></label>
            <label class="field"><span>Menu PDF URL</span><input formControlName="menuPdfUrl" maxlength="1000" /></label>
            <label class="field md:col-span-2"><span>Cover image URL</span><input formControlName="coverImageUrl" maxlength="1000" /></label>
            <label class="field md:col-span-2"><span>Media asset ids</span><input formControlName="mediaAssetIds" maxlength="2000" /></label>
          </div>
          <app-file-upload targetEntity="Venue" (uploaded)="attach($event)" />
          <app-translation-tabs [fields]="fields" [array]="form.controls.translations" requiredKey="name" />
          <div class="flex gap-3">
            <button class="btn-ink" type="submit" [disabled]="saving() || !hotels().length">{{ saving() ? 'Saving…' : 'Save' }}</button>
            <button class="btn-line" type="button" (click)="cancel()">Cancel</button>
          </div>
        </form>
      }
    }
  `,
})
export class VenuesAdminPage {
  private readonly admin = inject(AdminBrandingService);
  private readonly catalog = inject(LanguageCatalog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private requestToken = 0;
  protected readonly venueTypes = VENUE_TYPES;
  protected readonly fields: TranslationField[] = [
    { key: 'name', label: 'Name', maxlength: 200 },
    { key: 'cuisineType', label: 'Cuisine', maxlength: 120 },
    { key: 'description', label: 'Description', multiline: true },
  ];
  protected readonly form = this.fb.group({
    hotelId: this.fb.control<number | null>(null),
    venueType: this.fb.nonNullable.control<VenueType>('Restaurant'),
    openingHours: this.fb.nonNullable.control(''),
    menuPdfUrl: this.fb.nonNullable.control(''),
    coverImageUrl: this.fb.nonNullable.control(''),
    mediaAssetIds: this.fb.nonNullable.control(''),
    translations: this.fb.array<FormGroup>([]),
  });
  protected readonly rows = signal<VenueDto[]>([]);
  protected readonly hotels = signal<HotelDto[]>([]);
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

  protected hotelName(id: number): string {
    return this.hotels().find((hotel) => hotel.id === id)?.name || `Hotel ${id}`;
  }

  protected openCreate(): void {
    this.prepare();
    this.editingId.set(null);
    this.form.reset({
      hotelId: this.hotels()[0]?.id ?? null,
      venueType: 'Restaurant',
      openingHours: '',
      menuPdfUrl: '',
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
    loadLocalized(this.catalog.codes(), (language) => this.admin.getVenue(id, { language }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (loaded) => {
          if (token !== this.requestToken) return;
          const base = loaded[0]?.record;
          if (!base) {
            this.formError.set('This venue could not be loaded.');
            this.formLoading.set(false);
            return;
          }
          const existing = translationValues(loaded, 'name', (record) => ({
            name: record.name,
            description: record.description,
            cuisineType: record.cuisineType,
          }));
          this.unverified.set(loaded.some((row) => !!row.record.name) && Object.keys(existing).length === 0);
          this.form.patchValue({
            hotelId: base.hotelId,
            venueType: base.venueType,
            openingHours: base.openingHours ?? '',
            menuPdfUrl: base.menuPdfUrl ?? '',
            coverImageUrl: base.coverImageUrl ?? '',
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
    const raw = this.form.getRawValue();
    if (!raw.hotelId) {
      this.formError.set('Choose a hotel.');
      return;
    }
    const translations = readTranslations(this.form.controls.translations, 'name').map((row) => ({
      languageCode: row['languageCode'] ?? '',
      name: row['name'] ?? '',
      description: row['description'],
      cuisineType: row['cuisineType'],
    }));
    if (!translations.length) {
      this.formError.set('Add a name in at least one language.');
      return;
    }
    const body = {
      hotelId: raw.hotelId,
      venueType: raw.venueType,
      openingHours: emptyToNull(raw.openingHours),
      menuPdfUrl: emptyToNull(raw.menuPdfUrl),
      coverImageUrl: emptyToNull(raw.coverImageUrl),
      mediaAssetIds: emptyToNull(raw.mediaAssetIds),
      translations,
    };
    const id = this.editingId();
    this.saving.set(true);
    const request = id ? this.admin.updateVenue(id, body) : this.admin.createVenue(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.mode.set('list');
        this.notice.set('Venue saved.');
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(errorMessage(error));
      },
    });
  }

  protected remove(id: number): void {
    this.admin.deleteVenue(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.notice.set('Venue deleted.');
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
    if (asset.category === 'Menu' && asset.fileUrl) {
      this.form.controls.menuPdfUrl.setValue(asset.fileUrl);
    } else if (asset.fileUrl && asset.category !== 'Video' && !this.form.controls.coverImageUrl.value) {
      this.form.controls.coverImageUrl.setValue(asset.fileUrl);
    }
    this.form.controls.mediaAssetIds.setValue(appendMediaId(this.form.controls.mediaAssetIds.value, asset.id));
  }

  private prepare(): void {
    this.notice.set(null);
    this.formError.set(null);
    this.unverified.set(false);
  }

  private reload(): void {
    this.loading.set(true);
    forkJoin({ venues: this.admin.listVenues(), hotels: this.admin.listHotels() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ venues, hotels }) => {
          this.rows.set(venues);
          this.hotels.set(hotels);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(errorMessage(error));
          this.loading.set(false);
        },
      });
  }
}
