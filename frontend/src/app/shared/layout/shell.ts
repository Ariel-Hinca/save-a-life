import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass],
  template: `
    <div class="min-h-screen bg-surface pb-24 md:pb-8">
      <header class="sticky top-0 z-20 border-b border-red-100 bg-white/90 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a routerLink="/dashboard" class="flex items-center gap-2 font-bold text-primary">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">+</span>
            <span>Donor Companion</span>
          </a>
          <div class="hidden items-center gap-4 md:flex">
            @for (item of nav; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="text-primary"
                class="text-sm font-medium text-slate-600 hover:text-primary"
                >{{ item.label }}</a
              >
            }
            <button class="btn-secondary" type="button" (click)="logout()">Logout</button>
          </div>
          <div class="text-sm font-semibold text-slate-700 md:hidden">
            {{ greeting() }}
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-6xl px-4 py-6">
        <router-outlet />
      </main>

      <nav
        class="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      >
        <div class="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
          @for (item of mobileNav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="text-primary"
              class="flex flex-col items-center rounded-xl px-1 py-2 text-[11px] font-medium text-slate-500"
            >
              <span class="mb-1 text-lg" [ngClass]="item.iconClass">{{ item.icon }}</span>
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
    { path: '/dashboard', label: 'Home', icon: '⌂', iconClass: '' },
    { path: '/donations', label: 'History', icon: '☰', iconClass: '' },
    { path: '/scan', label: 'Scan', icon: '◉', iconClass: '' },
    { path: '/stats', label: 'Stats', icon: '▦', iconClass: '' },
    { path: '/profile', label: 'Profile', icon: '☺', iconClass: '' },
  ];

  logout(): void {
    this.auth.logout();
  }
}
