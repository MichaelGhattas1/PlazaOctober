import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MEDIA_CATEGORIES,
  MEDIA_TARGET_ENTITIES,
  MediaAssetDto,
  MediaCategory,
  MediaTargetEntity,
} from '../core/api/api.models';
import { AdminBrandingService } from '../core/api/admin-branding.service';
import { isVisualMedia } from '../shared/format';
import { errorMessage } from '../shared/http-error';

@Component({
  selector: 'app-media-admin',
  template: `
    <p class="kicker">Library</p>
    <h1 class="mt-2 text-6xl">Media</h1>
    <p class="mt-3 max-w-2xl text-sm text-bark">
      Upload a file, then paste its id into a hotel, venue, trip, event, owner, or company record. Cover and logo URLs can also be filled from the file address.
    </p>
    <form class="panel mt-8 grid gap-4 md:grid-cols-2" (submit)="upload($event)">
      <label class="field">
        <span>Belongs to</span>
        <select [value]="target()" (change)="onTarget($event)">
          @for (item of targets; track item) { <option [value]="item">{{ item }}</option> }
        </select>
      </label>
      <label class="field">
        <span>Category</span>
        <select [value]="category()" (change)="onCategory($event)">
          @for (item of categories; track item) { <option [value]="item">{{ item }}</option> }
        </select>
      </label>
      <label class="field md:col-span-2">
        <span>Files</span>
        <input #picker type="file" multiple (change)="onFiles($event)" />
      </label>
      @if (uploadError()) { <p class="text-sm text-red-800 md:col-span-2">{{ uploadError() }}</p> }
      <div>
        <button class="btn-ink" type="submit" [disabled]="uploading() || !files().length">
          {{ uploading() ? 'Uploading…' : 'Upload' }}
        </button>
      </div>
    </form>
    <div class="mt-8 flex flex-wrap gap-2">
      <button type="button" class="rounded-full px-3 py-1 text-sm" [class.bg-ink]="filter() === 'All'" [class.text-cream]="filter() === 'All'" (click)="setFilter('All')">All</button>
      @for (item of targets; track item) {
        <button type="button" class="rounded-full px-3 py-1 text-sm" [class.bg-ink]="filter() === item" [class.text-cream]="filter() === item" (click)="setFilter(item)">{{ item }}</button>
      }
    </div>
    @if (error()) { <p class="mt-4 text-sm text-red-800">{{ error() }}</p> }
    @if (loading()) {
      <p class="mt-6 text-bark">Loading…</p>
    } @else if (!rows().length) {
      <p class="mt-6 text-bark">No files in this view.</p>
    } @else {
      <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        @for (asset of rows(); track asset.id) {
          <article class="panel overflow-hidden p-0">
            @if (visual(asset) && asset.fileUrl) {
              <img [src]="asset.fileUrl" [alt]="asset.fileName || asset.category" class="aspect-[4/3] w-full object-cover" />
            } @else {
              <div class="grid aspect-[4/3] place-items-center bg-pine text-cream">{{ asset.category }}</div>
            }
            <div class="grid gap-2 p-4">
              <p class="font-medium">{{ asset.fileName || 'File ' + asset.id }}</p>
              <p class="text-sm text-bark">{{ asset.targetEntity }} · {{ asset.category }} · id {{ asset.id }}</p>
              @if (asset.fileUrl) {
                <a class="btn-quiet" [href]="asset.fileUrl" target="_blank" rel="noopener">Open file</a>
              }
              @if (confirmingId() === asset.id) {
                <div class="flex gap-3">
                  <button type="button" class="btn-danger" (click)="remove(asset.id)">Confirm delete</button>
                  <button type="button" class="btn-quiet" (click)="confirmingId.set(null)">Cancel</button>
                </div>
              } @else {
                <button type="button" class="btn-danger w-fit" (click)="confirmingId.set(asset.id)">Delete</button>
              }
            </div>
          </article>
        }
      </div>
    }
  `,
})
export class MediaAdminPage {
  private readonly admin = inject(AdminBrandingService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly targets = MEDIA_TARGET_ENTITIES;
  protected readonly categories = MEDIA_CATEGORIES;
  protected readonly target = signal<MediaTargetEntity>('Hotel');
  protected readonly category = signal<MediaCategory>('Image');
  protected readonly filter = signal<MediaTargetEntity | 'All'>('All');
  protected readonly files = signal<File[]>([]);
  protected readonly rows = signal<MediaAssetDto[]>([]);
  protected readonly loading = signal(true);
  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);
  protected readonly confirmingId = signal<number | null>(null);

  constructor() {
    this.reload();
  }

  protected visual(asset: MediaAssetDto): boolean {
    return isVisualMedia(asset.category);
  }

  protected onTarget(event: Event): void {
    this.target.set((event.target as HTMLSelectElement).value as MediaTargetEntity);
  }

  protected onCategory(event: Event): void {
    this.category.set((event.target as HTMLSelectElement).value as MediaCategory);
  }

  protected onFiles(event: Event): void {
    const input = event.target;
    this.files.set(input instanceof HTMLInputElement ? [...(input.files ?? [])] : []);
  }

  protected setFilter(value: MediaTargetEntity | 'All'): void {
    this.filter.set(value);
    this.reload();
  }

  protected upload(event: Event): void {
    event.preventDefault();
    const files = this.files();
    if (!files.length) return;
    this.uploading.set(true);
    this.uploadError.set(null);
    const done = () => {
      this.uploading.set(false);
      this.files.set([]);
      this.reload();
    };
    const fail = (error: unknown) => {
      this.uploading.set(false);
      this.uploadError.set(errorMessage(error));
    };
    if (files.length === 1) {
      this.admin
        .uploadMedia(files[0], this.target(), this.category())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: done, error: fail });
      return;
    }
    this.admin
      .uploadMediaFiles(files, this.target(), this.category())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: done, error: fail });
  }

  protected remove(id: number): void {
    this.admin.deleteMedia(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.reload();
      },
      error: (error: unknown) => this.error.set(errorMessage(error)),
    });
  }

  private reload(): void {
    this.loading.set(true);
    const filter = this.filter();
    this.admin
      .listMedia(filter === 'All' ? undefined : filter)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
