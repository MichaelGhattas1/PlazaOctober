import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { brandingApiPaths } from './api.config';
import {
  ApiCallOptions,
  BulkUploadResultDto,
  CompanyProfileDto,
  CreateCompanyProfileDto,
  CreateEventDto,
  CreateHotelDto,
  CreateOwnerDto,
  CreateSponsorDto,
  CreateTripDto,
  CreateVenueDto,
  EventDto,
  EventPagedResult,
  HotelDto,
  LanguageDto,
  MediaAssetDto,
  MediaCategory,
  MediaTargetEntity,
  OwnerDto,
  SponsorDto,
  TripDto,
  UpdateCompanyProfileDto,
  UpdateEventDto,
  UpdateHotelDto,
  UpdateOwnerDto,
  UpdateSponsorDto,
  UpdateTripDto,
  UpdateVenueDto,
  VenueDto,
} from './api.models';
import { BrandingHttp } from './branding-http.service';

/** Full branding API for the admin app, including creates, updates, deletes, and uploads. */
@Injectable({ providedIn: 'root' })
export class AdminBrandingService {
  private readonly http = inject(BrandingHttp);

  health(): Observable<string> {
    return this.http.getText(brandingApiPaths.health);
  }

  languages(options?: ApiCallOptions): Observable<LanguageDto[]> {
    return this.http.get<LanguageDto[]>(brandingApiPaths.languages, options);
  }

  currentCompany(options?: ApiCallOptions): Observable<CompanyProfileDto> {
    return this.http.get<CompanyProfileDto>(brandingApiPaths.companyCurrent, options);
  }

  listCompanies(options?: ApiCallOptions): Observable<CompanyProfileDto[]> {
    return this.http.get<CompanyProfileDto[]>(brandingApiPaths.company, options);
  }

  getCompany(id: number, options?: ApiCallOptions): Observable<CompanyProfileDto> {
    return this.http.get<CompanyProfileDto>(brandingApiPaths.companyById(id), options);
  }

  createCompany(
    body: CreateCompanyProfileDto,
    options?: ApiCallOptions,
  ): Observable<CompanyProfileDto> {
    return this.http.post<CompanyProfileDto>(brandingApiPaths.company, body, options);
  }

  updateCompany(
    id: number,
    body: UpdateCompanyProfileDto,
    options?: ApiCallOptions,
  ): Observable<CompanyProfileDto> {
    return this.http.put<CompanyProfileDto>(brandingApiPaths.companyById(id), body, options);
  }

  deleteCompany(id: number, options?: ApiCallOptions): Observable<void> {
    return this.http.delete(brandingApiPaths.companyById(id), options);
  }

  listHotels(options?: ApiCallOptions): Observable<HotelDto[]> {
    return this.http.get<HotelDto[]>(brandingApiPaths.hotels, options);
  }

  getHotel(id: number, options?: ApiCallOptions): Observable<HotelDto> {
    return this.http.get<HotelDto>(brandingApiPaths.hotelById(id), options);
  }

  createHotel(body: CreateHotelDto, options?: ApiCallOptions): Observable<HotelDto> {
    return this.http.post<HotelDto>(brandingApiPaths.hotels, body, options);
  }

  updateHotel(id: number, body: UpdateHotelDto, options?: ApiCallOptions): Observable<HotelDto> {
    return this.http.put<HotelDto>(brandingApiPaths.hotelById(id), body, options);
  }

  deleteHotel(id: number, options?: ApiCallOptions): Observable<void> {
    return this.http.delete(brandingApiPaths.hotelById(id), options);
  }

  listVenues(hotelId?: number, options?: ApiCallOptions): Observable<VenueDto[]> {
    return this.http.get<VenueDto[]>(brandingApiPaths.venues, {
      ...options,
      params: { hotelId },
    });
  }

  getVenue(id: number, options?: ApiCallOptions): Observable<VenueDto> {
    return this.http.get<VenueDto>(brandingApiPaths.venueById(id), options);
  }

  createVenue(body: CreateVenueDto, options?: ApiCallOptions): Observable<VenueDto> {
    return this.http.post<VenueDto>(brandingApiPaths.venues, body, options);
  }

  updateVenue(id: number, body: UpdateVenueDto, options?: ApiCallOptions): Observable<VenueDto> {
    return this.http.put<VenueDto>(brandingApiPaths.venueById(id), body, options);
  }

  deleteVenue(id: number, options?: ApiCallOptions): Observable<void> {
    return this.http.delete(brandingApiPaths.venueById(id), options);
  }

  listTrips(hotelId?: number, options?: ApiCallOptions): Observable<TripDto[]> {
    return this.http.get<TripDto[]>(brandingApiPaths.trips, {
      ...options,
      params: { hotelId },
    });
  }

  getTrip(id: number, options?: ApiCallOptions): Observable<TripDto> {
    return this.http.get<TripDto>(brandingApiPaths.tripById(id), options);
  }

  createTrip(body: CreateTripDto, options?: ApiCallOptions): Observable<TripDto> {
    return this.http.post<TripDto>(brandingApiPaths.trips, body, options);
  }

  updateTrip(id: number, body: UpdateTripDto, options?: ApiCallOptions): Observable<TripDto> {
    return this.http.put<TripDto>(brandingApiPaths.tripById(id), body, options);
  }

  deleteTrip(id: number, options?: ApiCallOptions): Observable<void> {
    return this.http.delete(brandingApiPaths.tripById(id), options);
  }

  listEvents(hotelId?: number, options?: ApiCallOptions): Observable<EventDto[]> {
    return this.http
      .get<EventPagedResult>(brandingApiPaths.events, {
        ...options,
        params: { hotelId, page: 1, pageSize: 100 },
      })
      .pipe(map((page) => page.items ?? []));
  }

  getEvent(id: number, options?: ApiCallOptions): Observable<EventDto> {
    return this.http.get<EventDto>(brandingApiPaths.eventById(id), options);
  }

  createEvent(body: CreateEventDto, options?: ApiCallOptions): Observable<EventDto> {
    return this.http.post<EventDto>(brandingApiPaths.events, body, options);
  }

  updateEvent(id: number, body: UpdateEventDto, options?: ApiCallOptions): Observable<EventDto> {
    return this.http.put<EventDto>(brandingApiPaths.eventById(id), body, options);
  }

  deleteEvent(id: number, options?: ApiCallOptions): Observable<void> {
    return this.http.delete(brandingApiPaths.eventById(id), options);
  }

  listOwners(options?: ApiCallOptions): Observable<OwnerDto[]> {
    return this.http.get<OwnerDto[]>(brandingApiPaths.owners, options);
  }

  getOwner(id: number, options?: ApiCallOptions): Observable<OwnerDto> {
    return this.http.get<OwnerDto>(brandingApiPaths.ownerById(id), options);
  }

  createOwner(body: CreateOwnerDto, options?: ApiCallOptions): Observable<OwnerDto> {
    return this.http.post<OwnerDto>(brandingApiPaths.owners, body, options);
  }

  updateOwner(id: number, body: UpdateOwnerDto, options?: ApiCallOptions): Observable<OwnerDto> {
    return this.http.put<OwnerDto>(brandingApiPaths.ownerById(id), body, options);
  }

  deleteOwner(id: number, options?: ApiCallOptions): Observable<void> {
    return this.http.delete(brandingApiPaths.ownerById(id), options);
  }

  listSponsors(activeOnly = false, options?: ApiCallOptions): Observable<SponsorDto[]> {
    return this.http.get<SponsorDto[]>(brandingApiPaths.sponsors, {
      ...options,
      params: { activeOnly },
    });
  }

  getSponsor(id: number, options?: ApiCallOptions): Observable<SponsorDto> {
    return this.http.get<SponsorDto>(brandingApiPaths.sponsorById(id), options);
  }

  createSponsor(body: CreateSponsorDto, options?: ApiCallOptions): Observable<SponsorDto> {
    return this.http.post<SponsorDto>(brandingApiPaths.sponsors, body, options);
  }

  updateSponsor(
    id: number,
    body: UpdateSponsorDto,
    options?: ApiCallOptions,
  ): Observable<SponsorDto> {
    return this.http.put<SponsorDto>(brandingApiPaths.sponsorById(id), body, options);
  }

  deleteSponsor(id: number, options?: ApiCallOptions): Observable<void> {
    return this.http.delete(brandingApiPaths.sponsorById(id), options);
  }

  listMedia(
    targetEntity?: MediaTargetEntity,
    options?: ApiCallOptions,
  ): Observable<MediaAssetDto[]> {
    return this.http.get<MediaAssetDto[]>(brandingApiPaths.media, {
      ...options,
      params: { targetEntity },
    });
  }

  getMedia(id: number, options?: ApiCallOptions): Observable<MediaAssetDto> {
    return this.http.get<MediaAssetDto>(brandingApiPaths.mediaById(id), options);
  }

  uploadMedia(
    file: File,
    targetEntity: MediaTargetEntity,
    category: MediaCategory,
    options?: ApiCallOptions,
  ): Observable<MediaAssetDto> {
    const body = new FormData();
    body.append('file', file);
    body.append('targetEntity', targetEntity);
    body.append('category', category);
    return this.http.postForm<MediaAssetDto>(brandingApiPaths.mediaUpload, body, options);
  }

  uploadMediaFiles(
    files: readonly File[],
    targetEntity: MediaTargetEntity,
    category: MediaCategory,
    options?: ApiCallOptions,
  ): Observable<BulkUploadResultDto> {
    const body = new FormData();
    for (const file of files) {
      body.append('files', file);
    }
    body.append('targetEntity', targetEntity);
    body.append('category', category);
    return this.http.postForm<BulkUploadResultDto>(
      brandingApiPaths.mediaUploadMultiple,
      body,
      options,
    );
  }

  deleteMedia(id: number, options?: ApiCallOptions): Observable<void> {
    return this.http.delete(brandingApiPaths.mediaById(id), options);
  }
}
