import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'https://plazzainn.runasp.net',
});

export const brandingApiPaths = {
  company: '/api/v1/company',
  companyCurrent: '/api/v1/company/current',
  companyById: (id: number) => `/api/v1/company/${id}`,
  hotels: '/api/v1/hotels',
  hotelById: (id: number) => `/api/v1/hotels/${id}`,
  venues: '/api/v1/venues',
  venueById: (id: number) => `/api/v1/venues/${id}`,
  trips: '/api/v1/trips',
  events: '/api/v1/events',
  eventById: (id: number) => `/api/v1/events/${id}`,
  tripById: (id: number) => `/api/v1/trips/${id}`,
  owners: '/api/v1/owners',
  ownerById: (id: number) => `/api/v1/owners/${id}`,
  sponsors: '/api/v1/sponsors',
  sponsorById: (id: number) => `/api/v1/sponsors/${id}`,
  languages: '/api/v1/languages',
  media: '/api/v1/media',
  mediaById: (id: number) => `/api/v1/media/${id}`,
  mediaUpload: '/api/v1/media/upload',
  mediaUploadMultiple: '/api/v1/media/upload-multiple',
  health: '/health',
  authLogin: '/api/v1/auth/login',
} as const;
