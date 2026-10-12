import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { brandingApiPaths } from './api.config';
import {
  ApiCallOptions,
  CompanyProfileDto,
  EventDto,
  EventPagedResult,
  HotelDto,
  LanguageDto,
  MediaAssetDto,
  MediaTargetEntity,
  OwnerDto,
  SponsorDto,
  TripDto,
  VenueDto,
} from './api.models';
import { BrandingHttp } from './branding-http.service';

/** Read-only calls for the public site. Text comes back in the active language. */
@Injectable({ providedIn: 'root' })
export class UserBrandingService {
  private readonly http = inject(BrandingHttp);

  company(options?: ApiCallOptions): Observable<CompanyProfileDto> {
    return this.http.get<CompanyProfileDto>(brandingApiPaths.companyCurrent, options);
  }

  hotels(options?: ApiCallOptions): Observable<HotelDto[]> {
    return this.http.get<HotelDto[]>(brandingApiPaths.hotels, options);
  }

  hotel(id: number, options?: ApiCallOptions): Observable<HotelDto> {
    return this.http.get<HotelDto>(brandingApiPaths.hotelById(id), options);
  }

  venues(hotelId?: number, options?: ApiCallOptions): Observable<VenueDto[]> {
    return this.http.get<VenueDto[]>(brandingApiPaths.venues, {
      ...options,
      params: { hotelId },
    });
  }

  venue(id: number, options?: ApiCallOptions): Observable<VenueDto> {
    return this.http.get<VenueDto>(brandingApiPaths.venueById(id), options);
  }

  trips(hotelId?: number, options?: ApiCallOptions): Observable<TripDto[]> {
    return this.http.get<TripDto[]>(brandingApiPaths.trips, {
      ...options,
      params: { hotelId },
    });
  }

  trip(id: number, options?: ApiCallOptions): Observable<TripDto> {
    return this.http.get<TripDto>(brandingApiPaths.tripById(id), options);
  }

  event(id: number, options?: ApiCallOptions): Observable<EventDto> {
    return this.http.get<EventDto>(brandingApiPaths.eventById(id), options);
  }

  events(options?: ApiCallOptions): Observable<EventDto[]> {
    return this.http
      .get<EventPagedResult>(brandingApiPaths.events, {
        ...options,
        params: { page: 1, pageSize: 100 },
      })
      .pipe(map((page) => page.items ?? []));
  }

  owners(options?: ApiCallOptions): Observable<OwnerDto[]> {
    return this.http.get<OwnerDto[]>(brandingApiPaths.owners, options);
  }

  owner(id: number, options?: ApiCallOptions): Observable<OwnerDto> {
    return this.http.get<OwnerDto>(brandingApiPaths.ownerById(id), options);
  }

  sponsors(options?: ApiCallOptions): Observable<SponsorDto[]> {
    return this.http.get<SponsorDto[]>(brandingApiPaths.sponsors, {
      ...options,
      params: { activeOnly: true },
    });
  }

  languages(options?: ApiCallOptions): Observable<LanguageDto[]> {
    return this.http.get<LanguageDto[]>(brandingApiPaths.languages, options);
  }

  media(targetEntity?: MediaTargetEntity, options?: ApiCallOptions): Observable<MediaAssetDto[]> {
    return this.http.get<MediaAssetDto[]>(brandingApiPaths.media, {
      ...options,
      params: { targetEntity },
    });
  }

  mediaAsset(id: number, options?: ApiCallOptions): Observable<MediaAssetDto> {
    return this.http.get<MediaAssetDto>(brandingApiPaths.mediaById(id), options);
  }
}
