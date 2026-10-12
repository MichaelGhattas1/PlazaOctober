import { Routes } from '@angular/router';
import { HomePage } from './home.component';
import { HotelDetailPage } from './hotel-detail.component';
import { HotelsPage } from './hotels.component';
import { EventDetailPage } from './event-detail.component';
import { EventsPage } from './events.component';
import { OwnersPage } from './owners.component';
import { TripDetailPage } from './trip-detail.component';
import { TripsPage } from './trips.component';
import { VenueDetailPage } from './venue-detail.component';
import { VenuesPage } from './venues.component';

export const publicRoutes: Routes = [
  { path: '', component: HomePage },
  { path: 'hotels', component: HotelsPage },
  { path: 'hotels/:id', component: HotelDetailPage },
  { path: 'venues', component: VenuesPage },
  { path: 'venues/:id', component: VenueDetailPage },
  { path: 'trips', component: TripsPage },
  { path: 'events', component: EventsPage },
  { path: 'events/:id', component: EventDetailPage },
  { path: 'trips/:id', component: TripDetailPage },
  { path: 'house', component: OwnersPage },
  { path: '**', redirectTo: '' },
];
