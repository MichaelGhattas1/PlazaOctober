import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AdminBrandingService } from '../core/api/admin-branding.service';
import { EventDto, HotelDto, MediaAssetDto } from '../core/api/api.models';
import { formatEventRange } from '../shared/format';
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
  selector: 'app-events-admin',
  imports: [ReactiveFormsModule, TranslationTabs, FileUpload],
  template: `
    @if (mode() === 'list') {
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="kicker">Programme</p>
          <h1 class="mt-2 text-6xl">Events</h1>
        </div>
        <button type="button" class="btn-ink" (click)="openCreate()">Add event</button>
      </div>
      @if (notice()) { <p class="mt-4 text-sm text-pine">{{ notice() }}</p> }
      @if (error()) { <p class="mt-4 text-sm text-red-800">{{ error() }}</p> }
      @if (loading()) {
        <p class="mt-8 text-bark">Loading…</p>
      } @else if (!rows().length) {
        <p class="mt-8 text-bark">No events yet.</p>
      } @else {
        <div class="mt-8 grid gap-4">
          @for (row of rows(); track row.id) {
            <article class="panel flex flex-col gap-4 md:flex-row md:items-center">
              <div class="min-w-0 flex-1">
                <p class="text-sm text-gold">{{ when(row) }}{{ row.location ? ' · ' + row.location : '' }}</p>
                <h2 class="text-4xl">{{ row.title || 'Untitled' }}</h2>
                @if (row.hotelId) {
                  <p class="text-sm text-bark">{{ hotelName(row.hotelId) }}</p>
                }
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
      <button type="button" class="btn-quiet" (click)="cancel()">Back to events</button>
      <h1 class="mt-4 text-5xl">{{ editingId() ? 'Edit event' : 'New event' }}</h1>
      @if (formLoading()) {
        <p class="mt-6 text-bark">Loading translations…</p>
      } @else {
        <form class="mt-6 grid gap-6" [formGroup]="form" (ngSubmit)="save()">
          @if (unverified()) {
            <p class="rounded-2xl bg-sand px-4 py-3 text-sm">Existing translations could not be matched to a language. Fill every language you want to keep before saving.</p>
          }
          @if (formError()) { <p class="text-sm text-red-800">{{ formError() }}</p> }
          <div class="grid gap-4 md:grid-cols-2">
            <label class="field"><span>Starts</span><input formControlName="startDate" type="datetime-local" required /></label>
            <label class="field"><span>Ends</span><input formControlName="endDate" type="datetime-local" /></label>
            <label class="field flex-row items-center gap-3"><input type="checkbox" formControlName="isAllDay" /><span>All day</span></label>
            <label class="field"><span>Hotel</span>
              <select formControlName="hotelId">
                <option [ngValue]="null">No hotel</option>
                @for (hotel of hotels(); track hotel.id) {
                  <option [ngValue]="hotel.id">{{ hotel.name || 'Hotel ' + hotel.id }}</option>
                }
              </select>
            </label>
            <label class="field md:col-span-2"><span>Location</span><input formControlName="location" maxlength="500" /></label>
            <label class="field md:col-span-2"><span>Cover image URL</span><input formControlName="coverImageUrl" maxlength="1000" /></label>
            <label class="field md:col-span-2"><span>Media asset ids</span><input formControlName="mediaAssetIds" maxlength="2000" /></label>
          </div>
          <app-file-upload targetEntity="Event" (uploaded)="attach($event)" />
          <app-translation-tabs [fields]="fields" [array]="form.controls.translations" requiredKey="title" />
          <div class="flex gap-3">
            <button class="btn-ink" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save' }}</button>
            <button class="btn-line" type="button" (click)="cancel()">Cancel</button>
          </div>
        </form>
      }
    }
  `,
})
export class EventsAdminPage {
  private readonly admin = inject(AdminBrandingService);
  private readonly catalog = inject(LanguageCatalog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private requestToken = 0;
  protected readonly fields: TranslationField[] = [
    { key: 'title', label: 'Title', maxlength: 200 },
    { key: 'shortDescription', label: 'Short description', maxlength: 500, multiline: true },
    { key: 'detailedDescription', label: 'Detailed description', multiline: true },
  ];
  protected readonly form = this.fb.group({
    startDate: this.fb.nonNullable.control(''),
    endDate: this.fb.nonNullable.control(''),
    isAllDay: this.fb.nonNullable.control(false),
    hotelId: this.fb.control<number | null>(null),
    location: this.fb.nonNullable.control(''),
    coverImageUrl: this.fb.nonNullable.control(''),
    mediaAssetIds: this.fb.nonNullable.control(''),
    translations: this.fb.array<FormGroup>([]),
  });
  protected readonly rows = signal<EventDto[]>([]);
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

  protected when(row: EventDto): string {
    return formatEventRange(row.startDate, row.endDate, row.isAllDay, 'en') || 'Date not set';
  }

  protected openCreate(): void {
    this.prepare();
    this.editingId.set(null);
    this.form.reset({
      startDate: '',
      endDate: '',
      isAllDay: false,
      hotelId: null,
      location: '',
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
    loadLocalized(this.catalog.codes(), (language) => this.admin.getEvent(id, { language }))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (loaded) => {
          if (token !== this.requestToken) return;
          const base = loaded[0]?.record;
          if (!base) {
            this.formError.set('This event could not be loaded.');
            this.formLoading.set(false);
            return;
          }
          const existing = translationValues(loaded, 'title', (record) => ({
            title: record.title,
            shortDescription: record.shortDescription,
            detailedDescription: record.detailedDescription,
          }));
          this.unverified.set(loaded.some((row) => !!row.record.title) && Object.keys(existing).length === 0);
          this.form.patchValue({
            startDate: toLocalInput(base.startDate),
            endDate: toLocalInput(base.endDate),
            isAllDay: base.isAllDay,
            hotelId: base.hotelId,
            location: base.location ?? '',
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
    const startDate = toDateTime(raw.startDate);
    const endDate = toDateTime(raw.endDate);
    if (!startDate) {
      this.formError.set('Choose a start date.');
      return;
    }
    if (endDate && new Date(endDate).getTime() < new Date(startDate).getTime()) {
      this.formError.set('The end must be on or after the start.');
      return;
    }
    const translations = readTranslations(this.form.controls.translations, 'title').map((row) => ({
      languageCode: row['languageCode'] ?? '',
      title: row['title'] ?? '',
      shortDescription: row['shortDescription'],
      detailedDescription: row['detailedDescription'],
    }));
    if (!translations.length) {
      this.formError.set('Add a title in at least one language.');
      return;
    }
    const body = {
      startDate,
      endDate,
      isAllDay: raw.isAllDay,
      location: emptyToNull(raw.location),
      coverImageUrl: emptyToNull(raw.coverImageUrl),
      mediaAssetIds: emptyToNull(raw.mediaAssetIds),
      hotelId: raw.hotelId,
      translations,
    };
    const id = this.editingId();
    this.saving.set(true);
    const request = id ? this.admin.updateEvent(id, body) : this.admin.createEvent(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.mode.set('list');
        this.notice.set('Event saved.');
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(errorMessage(error));
      },
    });
  }

  protected remove(id: number): void {
    this.admin.deleteEvent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.notice.set('Event deleted.');
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

  private reload(): void {
    this.loading.set(true);
    forkJoin({ events: this.admin.listEvents(), hotels: this.admin.listHotels() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ events, hotels }) => {
          this.rows.set(events);
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

function toLocalInput(value: string | null | undefined): string {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.exec(value?.trim() ?? '');
  return match?.[1] ?? '';
}

/** Wall-clock datetime for the API, such as 2026-11-15T18:00:00. */
function toDateTime(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(value.trim());
  if (!match) {
    return null;
  }
  const hours = match[4] ?? '00';
  const minutes = match[5] ?? '00';
  const seconds = match[6] ?? '00';
  return `${match[1]}-${match[2]}-${match[3]}T${hours}:${minutes}:${seconds}`;
}
