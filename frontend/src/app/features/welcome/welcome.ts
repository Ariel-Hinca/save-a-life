import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideCalendarClock,
  LucideDroplet,
  LucideHeartPulse,
  LucideScanLine,
  LucideTrophy,
} from '@lucide/angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitcherComponent } from '../../shared/language-switcher';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    RouterLink,
    LucideDroplet,
    LucideTrophy,
    LucideScanLine,
    LucideCalendarClock,
    LucideHeartPulse,
    LanguageSwitcherComponent,
  ],
  template: `
    <div class="min-h-screen">
      <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
        <header class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="icon-chip" aria-hidden="true">
              <svg lucideDroplet [size]="18" strokeWidth="2"></svg>
            </span>
            <div>
              <div class="font-semibold text-ink">{{ i18n.t('appName') }}</div>
              <div class="text-xs text-muted">{{ i18n.t('disclaimer') }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <app-language-switcher />
            <div class="hidden gap-3 sm:flex">
              <a routerLink="/login" class="btn-secondary">{{ i18n.t('signIn') }}</a>
              <a routerLink="/register" class="btn-primary">{{ i18n.t('createAccount') }}</a>
            </div>
          </div>
        </header>

        <section class="mt-14 grid flex-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 class="font-display text-5xl font-bold leading-[1.05] text-ink sm:text-6xl">
              {{ i18n.t('heroTitle1') }}<br />
              {{ i18n.t('heroTitle2') }}
            </h1>
            <p class="mt-6 max-w-xl text-lg leading-relaxed text-muted">{{ i18n.t('heroBody') }}</p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a routerLink="/register" class="btn-primary">{{ i18n.t('createAccount') }}</a>
              <a routerLink="/login" class="btn-secondary">{{ i18n.t('signIn') }}</a>
            </div>

            <ul class="mt-12 grid max-w-xl gap-4 border-t border-line pt-6 sm:grid-cols-3">
              <li class="flex items-start gap-3">
                <span class="icon-chip"><svg lucideTrophy [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="font-semibold text-ink">XP & levels</div>
                  <div class="text-sm text-muted">{{ i18n.t('quickActions') }}</div>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="icon-chip"><svg lucideScanLine [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="font-semibold text-ink">{{ i18n.t('ocrScan') }}</div>
                  <div class="text-sm text-muted">NL / FR / EN</div>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="icon-chip"><svg lucideCalendarClock [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="font-semibold text-ink">120d</div>
                  <div class="text-sm text-muted">{{ i18n.t('nextDonation') }}</div>
                </div>
              </li>
            </ul>
          </div>

          <aside class="card overflow-hidden p-0" aria-label="Product preview">
            <div class="bg-ink px-6 py-8 text-paper">
              <div class="flex items-center gap-2 text-sm text-stone-300">
                <svg lucideHeartPulse [size]="16" strokeWidth="2"></svg>
                Level 5
              </div>
              <h2 class="mt-2 font-display text-4xl font-bold">12</h2>
              <p class="mt-3 text-sm text-stone-300">{{ i18n.t('donations') }}</p>
            </div>
            <div class="space-y-3 p-6">
              <div class="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
                <span class="icon-chip"><svg lucideCalendarClock [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="text-xs font-semibold uppercase tracking-wide text-muted">
                    {{ i18n.t('nextDonation') }}
                  </div>
                  <div class="mt-0.5 text-lg font-semibold text-ink">15 Dec 2026</div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  `,
})
export class WelcomeComponent {
  readonly i18n = inject(I18nService);
}
