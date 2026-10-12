import { Routes } from '@angular/router';
import { adminAuthGuard } from './admin/admin-auth.guard';

export const routes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login.component').then((m) => m.LoginPage),
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () => import('./admin/admin-layout.component').then((m) => m.AdminLayout),
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    path: '',
    loadComponent: () => import('./public/public-layout.component').then((m) => m.PublicLayout),
    loadChildren: () => import('./public/public.routes').then((m) => m.publicRoutes),
  },
];
