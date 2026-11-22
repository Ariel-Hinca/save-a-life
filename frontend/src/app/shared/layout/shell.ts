import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideChartColumn,
  LucideDroplet,
  LucideFlaskConical,
  LucideHouse,
  LucideLogOut,
  LucideScanLine,
  LucideUserRound,
} from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideHouse,
    LucideDroplet,
    LucideScanLine,
    LucideChartColumn,
    LucideUserRound,
    LucideFlaskConical,
    LucideLogOut,
  ],
  template: `
    <div class="min-h-screen pb-24 md:pb-8">
      <header class="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a routerLink="/dashboard" class="flex items-center gap-2 font-semibold text-ink">
            <span class="icon-chip" aria-hidden="true">
              <svg lucideDroplet [size]="18" strokeWidth="2"></svg>
            </span>
            <span>Donor Companion</span>
          </a>
          <nav class="hidden items-center gap-1 md:flex" aria-label="Main">
            @for (item of nav; track item.path) {
              <a [routerLink]="item.path" routerLinkActive="active" class="nav-link inline-flex items-center gap-1.5">
                @switch (item.icon) {
                  @case ('home') {
                    <svg lucideHouse [size]="16" strokeWidth="2"></svg>
                  }
                  @case ('droplet') {
                    <svg lucideDroplet [size]="16" strokeWidth="2"></svg>
                  }
                  @case ('scan') {
                    <svg lucideScanLine [size]="16" strokeWidth="2"></svg>
                  }
                  @case ('flask') {
                    <svg lucideFlaskConical [size]="16" strokeWidth="2"></svg>
                  }
                  @case ('chart') {
                    <svg lucideChartColumn [size]="16" strokeWidth="2"></svg>
                  }
                  @case ('user') {
                    <svg lucideUserRound [size]="16" strokeWidth="2"></svg>
                  }
                }
                {{ item.label }}
              </a>
            }
            <button class="btn-secondary ml-2 inline-flex items-center gap-2" type="button" (click)="logout()">
              <svg lucideLogOut [size]="16" strokeWidth="2"></svg>
              Logout
            </button>
          </nav>
          <div class="text-sm font-semibold text-ink md:hidden">{{ greeting() }}</div>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 py-6">
        <router-outlet />
      </main>

      <nav
        class="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur md:hidden"
        aria-label="Mobile"
      >
        <div class="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          @for (item of mobileNav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="text-primary"
              class="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold text-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              @switch (item.icon) {
                @case ('home') {
                  <svg lucideHouse [size]="18" strokeWidth="2"></svg>
                }
                @case ('droplet') {
                  <svg lucideDroplet [size]="18" strokeWidth="2"></svg>
                }
                @case ('scan') {
                  <svg lucideScanLine [size]="18" strokeWidth="2"></svg>
                }
                @case ('chart') {
                  <svg lucideChartColumn [size]="18" strokeWidth="2"></svg>
                }
                @case ('user') {
                  <svg lucideUserRound [size]="18" strokeWidth="2"></svg>
                }
              }
              {{ item.label }}
            </a>
          }
        </div>
      </nav>
    </div>
  `,
})
export class ShellComponent {
  private readonly auth = inject(AuthService);

  readonly greeting = computed(() => {
    const user = this.auth.user();
    return user ? `Hi, ${user.firstName}` : 'Donor';
  });

  readonly nav = [
    { path: '/dashboard', label: 'Dashboard', icon: 'home' },
    { path: '/donations', label: 'Donations', icon: 'droplet' },
    { path: '/scan', label: 'Scan', icon: 'scan' },
    { path: '/results', label: 'Results', icon: 'flask' },
    { path: '/stats', label: 'Stats', icon: 'chart' },
    { path: '/profile', label: 'Profile', icon: 'user' },
  ];

  readonly mobileNav = [
    { path: '/dashboard', label: 'Home', icon: 'home' },
    { path: '/donations', label: 'History', icon: 'droplet' },
    { path: '/scan', label: 'Scan', icon: 'scan' },
    { path: '/stats', label: 'Stats', icon: 'chart' },
    { path: '/profile', label: 'Profile', icon: 'user' },
  ];

  logout(): void {
    this.auth.logout();
  }
}
