import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen pb-24 md:pb-8">
      <header class="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a routerLink="/dashboard" class="flex items-center gap-2 font-semibold text-ink">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-white"
              aria-hidden="true"
              >+</span
            >
            <span>Donor Companion</span>
          </a>
          <nav class="hidden items-center gap-1 md:flex" aria-label="Main">
            @for (item of nav; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                class="nav-link"
                >{{ item.label }}</a
              >
            }
            <button class="btn-secondary ml-2" type="button" (click)="logout()">Logout</button>
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
              class="flex flex-col items-center rounded-xl px-1 py-2 text-[11px] font-semibold text-muted focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span class="mb-1 text-base" aria-hidden="true">{{ item.icon }}</span>
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
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/donations', label: 'Donations' },
    { path: '/scan', label: 'Scan' },
    { path: '/results', label: 'Results' },
    { path: '/stats', label: 'Stats' },
    { path: '/profile', label: 'Profile' },
  ];

  readonly mobileNav = [
    { path: '/dashboard', label: 'Home', icon: '⌂' },
    { path: '/donations', label: 'History', icon: '☰' },
    { path: '/scan', label: 'Scan', icon: '◉' },
    { path: '/stats', label: 'Stats', icon: '▦' },
    { path: '/profile', label: 'Profile', icon: '☺' },
  ];

  logout(): void {
    this.auth.logout();
  }
}
