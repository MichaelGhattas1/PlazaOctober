export const LANGUAGE_CODES = ['ar', 'en', 'fr', 'zh', 'es'] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const MEDIA_TARGET_ENTITIES = [
  'Owner',
  'CompanyProfile',
  'Sponsor',
  'Hotel',
  'Venue',
  'Trip',
  'Event',
] as const;

export type MediaTargetEntity = (typeof MEDIA_TARGET_ENTITIES)[number];

export const MEDIA_CATEGORIES = [
  'Image',
  'Video',
  'Pdf',
  'Logo',
  'Cover',
  'Gallery',
  'Menu',
  'Document',
] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const VENUE_TYPES = [
  'Restaurant',
  'Lounge',
  'Spa',
  'Bar',
  'Cafe',
  'Pool',
  'Gym',
  'Ballroom',
  'Other',
] as const;

export type VenueType = (typeof VENUE_TYPES)[number];

export interface ApiCallOptions {
  language?: LanguageCode;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string | null;
  expiresAtUtc: string | null;
  email: string | null;
  roles: string[] | null;
}

export interface MediaAssetDto {
  id: number;
  publicId: string | null;
  fileName: string | null;
  fileUrl: string | null;
  contentType: string | null;
  targetEntity: MediaTargetEntity;
  category: MediaCategory;
  createdDate: string;
}

export interface BulkUploadResultDto {
  mediaAssetIdsString: string | null;
  mediaAssetIds: number[] | null;
  uploadedAssets: MediaAssetDto[] | null;
}

export interface LanguageDto {
  id: number;
  code: string | null;
  name: string | null;
  nativeName: string | null;
  isDefault: boolean;
  displayOrder: number;
}

export interface CompanyProfileTranslationDto {
  languageCode: string;
  name: string;
  aboutUs?: string | null;
  vision?: string | null;
  mission?: string | null;
}

export interface CompanyProfileDto {
  id: number;
  heroImageUrl: string | null;
  videoUrl: string | null;
  /** Opaque id string. Save `mediaAssetIdsString` from a bulk upload into this field. */
  mediaAssetIds: string | null;
  requestedLanguage: string | null;
  resolvedLanguage: string | null;
  name: string | null;
  aboutUs: string | null;
  vision: string | null;
  mission: string | null;
  mediaAssets: MediaAssetDto[] | null;
  createdDate: string;
}

export interface CreateCompanyProfileDto {
  heroImageUrl?: string | null;
  videoUrl?: string | null;
  mediaAssetIds?: string | null;
  translations: CompanyProfileTranslationDto[];
}

export type UpdateCompanyProfileDto = CreateCompanyProfileDto;

export interface HotelTranslationDto {
  languageCode: string;
  name: string;
  shortDescription?: string | null;
  detailedDescription?: string | null;
}

export interface HotelDto {
  id: number;
  starRating: number;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  mediaAssetIds: string | null;
  requestedLanguage: string | null;
  resolvedLanguage: string | null;
  name: string | null;
  shortDescription: string | null;
  detailedDescription: string | null;
  mediaAssets: MediaAssetDto[] | null;
  createdDate: string;
}

export interface CreateHotelDto {
  starRating: number;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverImageUrl?: string | null;
  mediaAssetIds?: string | null;
  translations: HotelTranslationDto[];
}

export type UpdateHotelDto = CreateHotelDto;

export interface VenueTranslationDto {
  languageCode: string;
  name: string;
  description?: string | null;
  cuisineType?: string | null;
}

export interface VenueDto {
  id: number;
  hotelId: number;
  venueType: VenueType;
  openingHours: string | null;
  menuPdfUrl: string | null;
  coverImageUrl: string | null;
  mediaAssetIds: string | null;
  requestedLanguage: string | null;
  resolvedLanguage: string | null;
  name: string | null;
  description: string | null;
  cuisineType: string | null;
  mediaAssets: MediaAssetDto[] | null;
  createdDate: string;
}

export interface CreateVenueDto {
  hotelId: number;
  venueType: VenueType;
  openingHours?: string | null;
  menuPdfUrl?: string | null;
  coverImageUrl?: string | null;
  mediaAssetIds?: string | null;
  translations: VenueTranslationDto[];
}

export type UpdateVenueDto = CreateVenueDto;

export interface TripTranslationDto {
  languageCode: string;
  title: string;
  shortDescription?: string | null;
  detailedDescription?: string | null;
  meetingPoint?: string | null;
}

export interface TripDto {
  id: number;
  hotelId: number | null;
  durationInHours: number;
  price: string | null;
  currency: string | null;
  coverImageUrl: string | null;
  mediaAssetIds: string | null;
  requestedLanguage: string | null;
  resolvedLanguage: string | null;
  title: string | null;
  shortDescription: string | null;
  detailedDescription: string | null;
  meetingPoint: string | null;
  mediaAssets: MediaAssetDto[] | null;
  createdDate: string;
}

export interface CreateTripDto {
  hotelId?: number | null;
  durationInHours: number;
  price?: string | null;
  currency: string;
  coverImageUrl?: string | null;
  mediaAssetIds?: string | null;
  translations: TripTranslationDto[];
}

export type UpdateTripDto = CreateTripDto;

export interface EventTranslationDto {
  languageCode: string;
  title: string;
  shortDescription?: string | null;
  detailedDescription?: string | null;
}

export interface EventDto {
  id: number;
  startDate: string;
  endDate: string | null;
  isAllDay: boolean;
  location: string | null;
  coverImageUrl: string | null;
  mediaAssetIds: string | null;
  hotelId: number | null;
  requestedLanguage: string | null;
  resolvedLanguage: string | null;
  title: string | null;
  shortDescription: string | null;
  detailedDescription: string | null;
  mediaAssets: MediaAssetDto[] | null;
  createdDate: string;
}

export interface EventPagedResult {
  items: EventDto[] | null;
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateEventDto {
  startDate: string;
  endDate?: string | null;
  isAllDay: boolean;
  location?: string | null;
  coverImageUrl?: string | null;
  mediaAssetIds?: string | null;
  hotelId?: number | null;
  translations: EventTranslationDto[];
}

export type UpdateEventDto = CreateEventDto;

export interface OwnerTranslationDto {
  languageCode: string;
  name: string;
  bio?: string | null;
  nationality?: string | null;
}

export interface OwnerDto {
  id: number;
  phone: string | null;
  email: string | null;
  companyRegistrationNumber: string | null;
  mediaAssetIds: string | null;
  requestedLanguage: string | null;
  resolvedLanguage: string | null;
  name: string | null;
  bio: string | null;
  nationality: string | null;
  mediaAssets: MediaAssetDto[] | null;
  createdDate: string;
}

export interface CreateOwnerDto {
  phone?: string | null;
  email?: string | null;
  companyRegistrationNumber?: string | null;
  mediaAssetIds?: string | null;
  translations: OwnerTranslationDto[];
}

export type UpdateOwnerDto = CreateOwnerDto;

export interface SponsorTranslationDto {
  languageCode: string;
  name: string;
  description?: string | null;
}

export interface SponsorDto {
  id: number;
  logoUrl: string | null;
  websiteUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  requestedLanguage: string | null;
  resolvedLanguage: string | null;
  name: string | null;
  description: string | null;
  createdDate: string;
}

export interface CreateSponsorDto {
  logoUrl?: string | null;
  websiteUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  translations: SponsorTranslationDto[];
}

export type UpdateSponsorDto = CreateSponsorDto;
