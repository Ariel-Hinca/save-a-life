import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAward,
  LucideCalendarClock,
  LucideDroplet,
  LucideHeartPulse,
  LucideClipboardList,
  LucideScanLine,
  LucideTrophy,
} from '@lucide/angular';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { StatsSummary } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    LucideScanLine,
    LucideDroplet,
    LucideCalendarClock,
    LucideHeartPulse,
    LucideTrophy,
    LucideAward,
    LucideClipboardList,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-sm text-muted">
            {{ i18n.t('welcomeBack') }}{{ userName() ? ', ' + userName() : '' }}
          </p>
          <h1 class="font-display text-3xl font-bold text-ink sm:text-4xl">{{ i18n.t('yourDashboard') }}</h1>
        </div>
        <div class="flex gap-2">
          <a routerLink="/scan" class="btn-primary inline-flex items-center gap-2">
            <svg lucideScanLine [size]="16" strokeWidth="2"></svg>
            {{ i18n.t('scanDocument') }}
          </a>
          <a routerLink="/donations" class="btn-secondary inline-flex items-center gap-2">
            <svg lucideDroplet [size]="16" strokeWidth="2"></svg>
            {{ i18n.t('addDonation') }}
          </a>
        </div>
      </div>

      @if (loading()) {
        <div class="state-box" role="status">{{ i18n.t('loadingProgress') }}</div>
      } @else if (error()) {
        <div class="state-box border-red-200 bg-red-50 text-red-800" role="alert">
          {{ error() }}
          <button class="btn-secondary mt-3" type="button" (click)="reload()">{{ i18n.t('tryAgain') }}</button>
        </div>
      } @else if (stats(); as s) {
        <section class="overflow-hidden rounded-3xl bg-ink p-6 text-paper shadow-card">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 text-sm text-stone-300">
                <svg lucideTrophy [size]="16" strokeWidth="2"></svg>
                {{ i18n.t('donorLevel') }} {{ s.donorLevel }}
              </div>
              <h2 class="mt-1 font-display text-4xl font-bold">
                {{ s.totalDonations }} {{ i18n.t('donationsCount') }}
              </h2>
              <p class="mt-2 text-stone-300">{{ s.xp }} {{ i18n.t('xpEarned') }}</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div class="flex items-center gap-2 text-xs uppercase tracking-wide text-stone-300">
                <svg lucideCalendarClock [size]="14" strokeWidth="2"></svg>
                {{ i18n.t('nextDonation') }}
              </div>
              <div class="mt-1 text-lg font-semibold">
                {{ s.nextEligibleDonationDate ? (s.nextEligibleDonationDate | date: 'd MMMM y') : i18n.t('eligibleNow') }}
              </div>
              <div class="text-sm text-stone-300">
                {{ donationTypeLabel(s.nextEligibleType) }}
              </div>
            </div>
          </div>
          <div class="mt-6 grid grid-cols-3 gap-3">
            <div class="rounded-2xl bg-white/5 p-4">
              <div class="mb-2 text-stone-300"><svg lucideHeartPulse [size]="18" strokeWidth="2"></svg></div>
              <div class="font-display text-2xl font-bold">{{ s.totalLivesHelped }}</div>
              <div class="text-xs text-stone-300">{{ i18n.t('livesImpacted') }}</div>
            </div>
            <div class="rounded-2xl bg-white/5 p-4">
              <div class="mb-2 text-stone-300"><svg lucideDroplet [size]="18" strokeWidth="2"></svg></div>
              <div class="font-display text-2xl font-bold">{{ s.totalBloodVolumeLiters | number: '1.1-1' }}</div>
              <div class="text-xs text-stone-300">{{ i18n.t('litersDonated') }}</div>
            </div>
            <div class="rounded-2xl bg-white/5 p-4">
              <div class="mb-2 text-stone-300"><svg lucideAward [size]="18" strokeWidth="2"></svg></div>
              <div class="font-display text-2xl font-bold">{{ unlockedCount(s) }}</div>
              <div class="text-xs text-stone-300">{{ i18n.t('badgesUnlocked') }}</div>
            </div>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <div class="card">
            <h3 class="flex items-center gap-2 font-display text-xl font-semibold text-ink">
              <svg lucideAward [size]="18" strokeWidth="2"></svg>
              {{ i18n.t('recentAchievements') }}
            </h3>
            <div class="mt-4 space-y-3">
              @for (a of s.achievements.slice(0, 4); track a.code) {
                <div class="flex items-center justify-between rounded-xl bg-surface px-3 py-3">
                  <div>
                    <div class="font-semibold text-ink">{{ a.name }}</div>
                    <div class="text-xs text-muted">{{ a.description }}</div>
                  </div>
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-semibold"
                    [class]="a.unlocked ? 'bg-green-100 text-success' : 'bg-stone-200 text-muted'"
                  >
                    {{ a.unlocked ? i18n.t('unlocked') : a.progressPercent + '%' }}
                  </span>
                </div>
              }
            </div>
            <a routerLink="/stats" class="mt-4 inline-block text-sm font-semibold text-accent"
              >{{ i18n.t('viewAllStats') }} →</a
            >
          </div>

          <div class="card">
            <h3 class="font-display text-xl font-semibold text-ink">{{ i18n.t('quickActions') }}</h3>
            <div class="mt-4 grid gap-3">
              <a
                routerLink="/scan"
                class="flex items-start gap-3 rounded-xl border border-line p-4 transition hover:border-primary/40 hover:bg-red-50/40"
              >
                <span class="icon-chip"><svg lucideScanLine [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="font-semibold text-ink">{{ i18n.t('ocrScan') }}</div>
                  <div class="text-sm text-muted">{{ i18n.t('ocrScanDesc') }}</div>
                </div>
              </a>
              <a
                routerLink="/results"
                class="flex items-start gap-3 rounded-xl border border-line p-4 transition hover:border-accent/40 hover:bg-teal-50/50"
              >
                <span class="icon-chip"><svg lucideHeartPulse [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="font-semibold text-ink">{{ i18n.t('bloodResults') }}</div>
                  <div class="text-sm text-muted">{{ i18n.t('bloodResultsDesc') }}</div>
                </div>
              </a>
              <a
                routerLink="/donations"
                class="flex items-start gap-3 rounded-xl border border-line p-4 transition hover:border-success/40 hover:bg-green-50/50"
              >
                <span class="icon-chip"><svg lucideClipboardList [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="font-semibold text-ink">{{ i18n.t('donationHistory') }}</div>
                  <div class="text-sm text-muted">{{ i18n.t('donationHistoryDesc') }}</div>
                </div>
              </a>
            </div>
          </div>
        </section>
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  readonly i18n = inject(I18nService);

  readonly stats = signal<StatsSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly userName = signal(this.auth.user()?.firstName || '');

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getStatsSummary().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
        this.userName.set(this.auth.user()?.firstName || '');
      },
      error: () => {
        this.loading.set(false);
        this.error.set(this.i18n.t('loadDashboardError'));
      },
    });
  }

  unlockedCount(s: StatsSummary): number {
    return s.achievements.filter((a) => a.unlocked).length;
  }

  donationTypeLabel(type: string | null | undefined): string {
    if (!type) return this.i18n.t('wholeBlood');
    const key = type.toLowerCase();
    if (key.includes('plasma')) return this.i18n.t('plasma');
    if (key.includes('platelet')) return this.i18n.t('platelets');
    return this.i18n.t('wholeBlood');
  }
}
