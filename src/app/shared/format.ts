import { MediaAssetDto, MediaCategory } from '../core/api/api.models';

const visualCategories = new Set<MediaCategory>(['Image', 'Cover', 'Gallery', 'Logo']);
const documentCategories = new Set<MediaCategory>(['Pdf', 'Menu', 'Document']);

export function imageUrl(entity: {
  coverImageUrl?: string | null;
  heroImageUrl?: string | null;
  logoUrl?: string | null;
  mediaAssets?: MediaAssetDto[] | null;
}): string | null {
  if (entity.coverImageUrl) return entity.coverImageUrl;
  if (entity.heroImageUrl) return entity.heroImageUrl;
  if (entity.logoUrl) return entity.logoUrl;
  const match = entity.mediaAssets?.find((item) => item.fileUrl && visualCategories.has(item.category));
  return match?.fileUrl ?? null;
}

export function galleryOf(
  assets: MediaAssetDto[] | null | undefined,
  cover?: string | null,
): MediaAssetDto[] {
  return (assets ?? []).filter(
    (item) => !!item.fileUrl && item.fileUrl !== cover && visualCategories.has(item.category),
  );
}

export function documentsOf(assets: MediaAssetDto[] | null | undefined): MediaAssetDto[] {
  return (assets ?? []).filter((item) => !!item.fileUrl && documentCategories.has(item.category));
}

export function starSlots(count: number): boolean[] {
  const filled = Math.max(0, Math.min(5, Math.round(count || 0)));
  return [0, 1, 2, 3, 4].map((index) => index < filled);
}

/** Formats an API event timestamp such as 2026-11-15T18:00:00 without shifting the clock time. */
export function formatEventDate(
  value: string | null | undefined,
  allDay: boolean,
  locale: string,
): string {
  const parts = eventDateParts(value);
  if (!parts) {
    return value?.trim() ?? '';
  }
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  return new Intl.DateTimeFormat(
    locale,
    allDay ? { dateStyle: 'medium', timeZone: 'UTC' } : { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' },
  ).format(date);
}

export function formatEventRange(
  start: string | null | undefined,
  end: string | null | undefined,
  allDay: boolean,
  locale: string,
): string {
  const startText = formatEventDate(start, allDay, locale);
  const endText = formatEventDate(end, allDay, locale);
  if (startText && endText && startText !== endText) {
    return `${startText} – ${endText}`;
  }
  return startText || endText;
}

function eventDateParts(value: string | null | undefined): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(value?.trim() ?? '');
  if (!match) {
    return null;
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] ?? 0),
    minute: Number(match[5] ?? 0),
  };
}

export function formatPrice(
  price: string | number | null | undefined,
  currency: string | null,
  locale: string,
): string {
  const text = price == null ? '' : String(price).trim();
  if (!text) {
    return '';
  }
  return text
    .split(/\s*-\s*/)
    .map((part) => formatAmount(part.trim(), currency, locale))
    .filter(Boolean)
    .join(' – ');
}

function formatAmount(price: string, currency: string | null, locale: string): string {
  const amount = Number(price);
  if (!currency || !/^[A-Za-z]{3}$/.test(currency) || !Number.isFinite(amount)) {
    return currency ? `${price} ${currency}` : price;
  }
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: currency.toUpperCase() }).format(
      amount,
    );
  } catch {
    return `${price} ${currency}`;
  }
}

export function mapLink(place: {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  country: string | null;
}): string | null {
  if (place.latitude != null && place.longitude != null) {
    return `https://maps.google.com/?q=${place.latitude},${place.longitude}`;
  }
  const query = [place.address, place.city, place.country].filter(Boolean).join(', ');
  return query ? `https://maps.google.com/?q=${encodeURIComponent(query)}` : null;
}

export type FilmSource =
  | { kind: 'file'; src: string }
  | { kind: 'youtube'; id: string }
  | { kind: 'vimeo'; id: string }
  | { kind: 'link'; href: string };

export function filmSource(url: string | null | undefined): FilmSource | null {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (/\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(trimmed)) {
    return { kind: 'file', src: trimmed };
  }
  const youtube = trimmed.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i,
  );
  if (youtube?.[1]) {
    return { kind: 'youtube', id: youtube[1] };
  }
  const vimeo = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo?.[1]) {
    return { kind: 'vimeo', id: vimeo[1] };
  }
  return { kind: 'link', href: trimmed };
}

export function isVisualMedia(category: MediaCategory): boolean {
  return visualCategories.has(category);
}

/** Turns a bare domain such as addidas.com into an absolute https link. */
export function externalUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim() ?? '';
  if (!trimmed) {
    return null;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }
  if (/^[\w.-]+\.[a-z]{2,}([/?#].*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function isVideoMedia(asset: MediaAssetDto): boolean {
  if (!asset.fileUrl) {
    return false;
  }
  if (asset.category === 'Video' || (asset.contentType ?? '').toLowerCase().startsWith('video/')) {
    return true;
  }
  const film = filmSource(asset.fileUrl);
  return film?.kind === 'file' || film?.kind === 'youtube' || film?.kind === 'vimeo';
}
