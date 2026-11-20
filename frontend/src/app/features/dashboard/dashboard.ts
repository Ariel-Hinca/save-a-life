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
          <p class="text-sm text-slate-500">Welcome back{{ userName() ? ', ' + userName() : '' }}</p>
          <h1 class="text-3xl font-bold text-slate-900">Your donor dashboard</h1>
        </div>
        <div class="flex gap-2">
          <a routerLink="/scan" class="btn-primary">Scan document</a>
          <a routerLink="/donations" class="btn-secondary">Add donation</a>
        </div>
      </div>

      @if (loading()) {
        <div class="card text-slate-500">Loading your progress…</div>
      } @else if (stats(); as s) {
        <section class="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-red-700 p-6 text-white shadow-card">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-sm text-red-100">Donor Level {{ s.donorLevel }}</p>
              <h2 class="mt-1 text-4xl font-extrabold">{{ s.totalDonations }} Donations</h2>
              <p class="mt-2 text-red-100">{{ s.xp }} XP earned</p>
            </div>
            <div class="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
              <div class="text-xs uppercase tracking-wide text-red-100">Next Donation</div>
              <div class="mt-1 text-lg font-semibold">
                {{ s.nextEligibleDonationDate ? (s.nextEligibleDonationDate | date: 'MMMM d y') : 'Eligible now' }}
              </div>
              <div class="text-sm text-red-100">{{ s.nextEligibleType || 'Whole Blood' }}</div>
            </div>
          </div>
          <div class="mt-6 grid grid-cols-3 gap-3">
            <div class="rounded-2xl bg-white/10 p-4">
              <div class="text-2xl font-bold">{{ s.totalLivesHelped }}</div>
              <div class="text-xs text-red-100">Lives impacted</div>
            </div>
            <div class="rounded-2xl bg-white/10 p-4">
              <div class="text-2xl font-bold">{{ s.totalBloodVolumeLiters | number: '1.1-1' }}</div>
              <div class="text-xs text-red-100">Liters donated</div>
            </div>
            <div class="rounded-2xl bg-white/10 p-4">
              <div class="text-2xl font-bold">{{ unlockedCount(s) }}</div>
              <div class="text-xs text-red-100">Badges unlocked</div>
            </div>
          </div>
        </section>

        <section class="grid gap-4 md:grid-cols-2">
          <div class="card">
            <h3 class="font-semibold text-slate-900">Recent achievements</h3>
            <div class="mt-4 space-y-3">
              @for (a of s.achievements.slice(0, 4); track a.code) {
                <div class="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
                  <div>
                    <div class="font-medium">{{ a.name }}</div>
                    <div class="text-xs text-slate-500">{{ a.description }}</div>
                  </div>
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-semibold"
                    [class]="a.unlocked ? 'bg-green-100 text-success' : 'bg-slate-200 text-slate-500'"
                  >
                    {{ a.unlocked ? 'Unlocked' : a.progressPercent + '%' }}
                  </span>
                </div>
              }
            </div>
            <a routerLink="/stats" class="mt-4 inline-block text-sm font-semibold text-accent">View all stats →</a>
          </div>

          <div class="card">
            <h3 class="font-semibold text-slate-900">Quick actions</h3>
            <div class="mt-4 grid gap-3">
              <a routerLink="/scan" class="rounded-xl border border-slate-100 p-4 hover:border-primary/30 hover:bg-red-50">
                <div class="font-semibold">OCR Scan</div>
                <div class="text-sm text-slate-500">Photograph your donation report</div>
              </a>
              <a routerLink="/results" class="rounded-xl border border-slate-100 p-4 hover:border-accent/30 hover:bg-blue-50">
                <div class="font-semibold">Blood results</div>
                <div class="text-sm text-slate-500">Follow hemoglobin, ferritin & more</div>
              </a>
              <a routerLink="/donations" class="rounded-xl border border-slate-100 p-4 hover:border-success/30 hover:bg-green-50">
                <div class="font-semibold">Donation history</div>
                <div class="text-sm text-slate-500">Review every visit and type</div>
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
  readonly userName = signal(this.auth.user()?.firstName || '');

  ngOnInit(): void {
    this.api.getStatsSummary().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  unlockedCount(s: StatsSummary): number {
    return s.achievements.filter((a) => a.unlocked).length;
  }
}
