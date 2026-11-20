import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { ShellComponent } from './shared/layout/shell';
import { WelcomeComponent } from './features/welcome/welcome';
import { LoginComponent } from './features/login/login';
import { RegisterComponent } from './features/register/register';
import { DashboardComponent } from './features/dashboard/dashboard';
import { DonationsComponent } from './features/donations/donations';
import { ScanComponent } from './features/scan/scan';
import { ResultsComponent } from './features/results/results';
import { StatsComponent } from './features/stats/stats';
import { ProfileComponent } from './features/profile/profile';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: WelcomeComponent, canActivate: [guestGuard] },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'donations', component: DonationsComponent },
      { path: 'scan', component: ScanComponent },
      { path: 'results', component: ResultsComponent },
      { path: 'stats', component: StatsComponent },
      { path: 'profile', component: ProfileComponent },
    ],
  },
  { path: '**', redirectTo: '' },
];
