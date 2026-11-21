import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { StatsSummary } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p class="text-sm text-muted">Welcome back{{ userName() ? ', ' + userName() : '' }}</p>
          <h1 class="font-display text-3xl font-bold text-ink sm:text-4xl">Your donor dashboard</h1>
        </div>
        <div class="flex gap-2">
          <a routerLink="/scan" class="btn-primary">Scan document</a>
          <a routerLink="/donations" class="btn-secondary">Add donation</a>
        </div>
      </div>

      @if (loading()) {
        <div class="state-box" role="status">Loading your progress…</div>
      } @else if (error()) {
        <div class="state-box border-red-200 bg-red-50 text-red-800" role="alert">
          {{ error() }}
          <button class="btn-secondary mt-3" type="button" (click)="reload()">Try again</button>
        </div>
      } @else if (stats(); as s) {
        <section class="overflow-hidden rounded-3xl bg-ink p-6 text-paper shadow-card">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-sm text-stone-300">Donor Level {{ s.donorLevel }}</p>
              <h2 class="mt-1 font-display text-4xl font-bold">{{ s.totalDonations }} donations</h2>
              <p class="mt-2 text-stone-300">{{ s.xp }} XP earned</p>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div class="text-xs uppercase tracking-wide text-stone-300">Next donation</div>
              <div class="mt-1 text-lg font-semibold">
                {{ s.nextEligibleDonationDate ? (s.nextEligibleDonationDate | date: 'd MMMM y') : 'Eligible now' }}
              </div>
              <div class="text-sm text-stone-300">{{ s.nextEligibleType || 'Whole Blood' }}</div>
            </div>
          </div>
          <div class="mt-6 grid grid-cols-3 gap-3">
            <div class="rounded-2xl bg-white/5 p-4">
              <div class="font-display text-2xl font-bold">{{ s.totalLivesHelped }}</div>
              <div class="text-xs text-stone-300">Lives impacted</div>
            </div>
            <div class="rounded-2xl bg-white/5 p-4">
              <div class="font-display text-2xl font-bold">{{ s.totalBloodVolumeLiters | number: '1.1-1' }}</div>
              <div class="text-xs text-stone-300">Liters donated</div>
            </div>
            <div class="rounded-2xl bg-white/5 p-4">
              <div class="font-display text-2xl font-bold">{{ unlockedCount(s) }}</div>
              <div class="text-xs text-stone-300">Badges unlocked</div>
            </div>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <div class="card">
            <h3 class="font-display text-xl font-semibold text-ink">Recent achievements</h3>
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
                    {{ a.unlocked ? 'Unlocked' : a.progressPercent + '%' }}
                  </span>
                </div>
              }
            </div>
            <a routerLink="/stats" class="mt-4 inline-block text-sm font-semibold text-accent">View all stats →</a>
          </div>

          <div class="card">
            <h3 class="font-display text-xl font-semibold text-ink">Quick actions</h3>
            <div class="mt-4 grid gap-3">
              <a routerLink="/scan" class="rounded-xl border border-line p-4 transition hover:border-primary/40 hover:bg-red-50/40">
                <div class="font-semibold text-ink">OCR Scan</div>
                <div class="text-sm text-muted">Photograph your donation report</div>
              </a>
              <a routerLink="/results" class="rounded-xl border border-line p-4 transition hover:border-accent/40 hover:bg-teal-50/50">
                <div class="font-semibold text-ink">Blood results</div>
                <div class="text-sm text-muted">Follow hemoglobin, ferritin & more</div>
              </a>
              <a routerLink="/donations" class="rounded-xl border border-line p-4 transition hover:border-success/40 hover:bg-green-50/50">
                <div class="font-semibold text-ink">Donation history</div>
                <div class="text-sm text-muted">Review every visit and type</div>
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
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load your dashboard. Check that the API is running.');
      },
    });
  }

  unlockedCount(s: StatsSummary): number {
    return s.achievements.filter((a) => a.unlocked).length;
  }
}
