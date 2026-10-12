import { Component, inject, input, output, signal } from '@angular/core';
import {
  MEDIA_CATEGORIES,
  MediaAssetDto,
  MediaCategory,
  MediaTargetEntity,
} from '../core/api/api.models';
import { AdminBrandingService } from '../core/api/admin-branding.service';
import { errorMessage } from './http-error';

@Component({
  selector: 'app-file-upload',
  template: `
    <div class="grid gap-3 rounded-2xl border border-dashed border-sand p-4">
      <label class="field">
        <span>Upload a file</span>
        <select [value]="category()" (change)="onCategory($event)">
          @for (item of categories; track item) {
            <option [value]="item">{{ item }}</option>
          }
        </select>
      </label>
      <input type="file" [disabled]="uploading()" (change)="onFile($event)" />
      @if (uploading()) {
        <p class="text-sm text-bark">Uploading…</p>
      }
      @if (note()) {
        <p class="text-sm text-pine">{{ note() }}</p>
      }
      @if (error()) {
        <p class="text-sm text-red-800">{{ error() }}</p>
      }
    </div>
  `,
})
export class FileUpload {
  readonly targetEntity = input.required<MediaTargetEntity>();
  readonly uploaded = output<MediaAssetDto>();

  protected readonly categories = MEDIA_CATEGORIES;
  protected readonly category = signal<MediaCategory>('Image');
  protected readonly uploading = signal(false);
  protected readonly note = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  private readonly admin = inject(AdminBrandingService);

  protected onCategory(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if ((MEDIA_CATEGORIES as readonly string[]).includes(value)) {
      this.category.set(value as MediaCategory);
    }
  }

  protected onFile(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.uploading.set(true);
    this.error.set(null);
    this.note.set(null);
    this.admin.uploadMedia(file, this.targetEntity(), this.category()).subscribe({
      next: (asset) => {
        this.uploading.set(false);
        this.note.set(`Added ${asset.fileName || file.name}.`);
        this.uploaded.emit(asset);
        input.value = '';
      },
      error: (error: unknown) => {
        this.uploading.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
