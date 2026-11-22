import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { LucideAward, LucideChartColumn, LucideHeartPulse, LucideTrophy } from '@lucide/angular';
import { StatsSummary } from '../../core/models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [LucideChartColumn, LucideTrophy, LucideHeartPulse, LucideAward],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="flex items-center gap-2 font-display text-3xl font-bold text-ink">
          <svg lucideChartColumn [size]="28" strokeWidth="2"></svg>
          Statistics
        </h1>
        <p class="text-muted">Visualize your donation journey and achievement progress.</p>
      </div>

      @if (loading()) {
        <div class="card text-slate-500">Loading charts…</div>
      } @else if (stats(); as s) {
        <section class="grid gap-4 sm:grid-cols-3">
          <div class="card">
            <div class="mb-2 text-primary"><svg lucideTrophy [size]="18" strokeWidth="2"></svg></div>
            <div class="text-xs text-muted">Level</div>
            <div class="font-display text-3xl font-bold text-ink">{{ s.donorLevel }}</div>
          </div>
          <div class="card">
            <div class="mb-2 text-primary"><svg lucideAward [size]="18" strokeWidth="2"></svg></div>
            <div class="text-xs text-muted">XP</div>
            <div class="font-display text-3xl font-bold text-ink">{{ s.xp }}</div>
          </div>
          <div class="card">
            <div class="mb-2 text-primary"><svg lucideHeartPulse [size]="18" strokeWidth="2"></svg></div>
            <div class="text-xs text-muted">Lives helped</div>
            <div class="font-display text-3xl font-bold text-ink">{{ s.totalLivesHelped }}</div>
          </div>
        </section>

        <section class="grid gap-4 lg:grid-cols-2">
          <div class="card">
            <h2 class="mb-4 font-semibold">Donations per year</h2>
            <canvas #yearChart></canvas>
          </div>
          <div class="card">
            <h2 class="mb-4 font-semibold">Donation types</h2>
            <canvas #typeChart></canvas>
          </div>
          <div class="card lg:col-span-2">
            <h2 class="mb-4 font-semibold">Total blood volume</h2>
            <canvas #volumeChart></canvas>
          </div>
        </section>

        <section class="card">
          <h2 class="mb-4 font-semibold">Achievement progress</h2>
          <div class="space-y-4">
            @for (a of s.achievements; track a.code) {
              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="font-medium">{{ a.name }}</span>
                  <span class="text-slate-500">{{ a.progressPercent }}%</span>
                </div>
                <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all"
                    [style.width.%]="a.progressPercent"
                    [style.background]="a.unlocked ? '#16A34A' : '#DC2626'"
                  ></div>
                </div>
                <p class="mt-1 text-xs text-slate-500">{{ a.description }}</p>
              </div>
            }
          </div>
        </section>
      }
    </div>
  `,
})
export class StatsComponent implements OnInit, OnDestroy {
  @ViewChild('yearChart') yearChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeChart') typeChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('volumeChart') volumeChartRef?: ElementRef<HTMLCanvasElement>;

  private readonly api = inject(ApiService);
  private charts: Chart[] = [];

  readonly stats = signal<StatsSummary | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.api.getStatsSummary().subscribe({
      next: (s) => {
        this.stats.set(s);
        this.loading.set(false);
        setTimeout(() => this.renderCharts(s), 0);
      },
      error: () => this.loading.set(false),
    });
  }

  private renderCharts(s: StatsSummary): void {
    this.destroyCharts();

    if (this.yearChartRef) {
      const cfg: ChartConfiguration = {
        type: 'bar',
        data: {
          labels: s.donationsPerYear.map((x) => String(x.year)),
          datasets: [
            {
              label: 'Donations',
              data: s.donationsPerYear.map((x) => x.count),
              backgroundColor: '#DC2626',
              borderRadius: 8,
            },
          ],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      };
      this.charts.push(new Chart(this.yearChartRef.nativeElement, cfg));
    }

    if (this.typeChartRef) {
      const cfg: ChartConfiguration = {
        type: 'pie',
        data: {
          labels: s.donationTypes.map((x) => x.type),
          datasets: [
            {
              data: s.donationTypes.map((x) => x.count),
              backgroundColor: ['#DC2626', '#2563EB', '#16A34A'],
            },
          ],
        },
        options: { responsive: true },
      };
      this.charts.push(new Chart(this.typeChartRef.nativeElement, cfg));
    }

    if (this.volumeChartRef) {
      const cfg: ChartConfiguration = {
        type: 'line',
        data: {
          labels: s.volumeOverTime.map((x) => x.label),
          datasets: [
            {
              label: 'Cumulative liters',
              data: s.volumeOverTime.map((x) => x.cumulativeLiters),
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              fill: true,
              tension: 0.35,
            },
          ],
        },
        options: { responsive: true },
      };
      this.charts.push(new Chart(this.volumeChartRef.nativeElement, cfg));
    }
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }
}
