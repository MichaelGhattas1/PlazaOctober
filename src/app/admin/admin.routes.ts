import { Routes } from '@angular/router';
import { CompanyAdminPage } from './company-admin.component';
import { DashboardPage } from './dashboard.component';
import { EventsAdminPage } from './events-admin.component';
import { HotelsAdminPage } from './hotels-admin.component';
import { MediaAdminPage } from './media-admin.component';
import { OwnersAdminPage } from './owners-admin.component';
import { SponsorsAdminPage } from './sponsors-admin.component';
import { TripsAdminPage } from './trips-admin.component';
import { VenuesAdminPage } from './venues-admin.component';

export const adminRoutes: Routes = [
  { path: '', component: DashboardPage },
  { path: 'company', component: CompanyAdminPage },
  { path: 'hotels', component: HotelsAdminPage },
  { path: 'venues', component: VenuesAdminPage },
  { path: 'trips', component: TripsAdminPage },
  { path: 'events', component: EventsAdminPage },
  { path: 'owners', component: OwnersAdminPage },
  { path: 'sponsors', component: SponsorsAdminPage },
  { path: 'media', component: MediaAdminPage },
  { path: '**', redirectTo: '/admin' },
];
