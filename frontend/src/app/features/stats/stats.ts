import {
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { LucideAward, LucideChartColumn, LucideHeartPulse, LucideTrophy } from '@lucide/angular';
import { ApiService } from '../../core/services/api.service';
import { I18nService } from '../../core/i18n/i18n.service';
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
          {{ i18n.t('statistics') }}
        </h1>
        <p class="text-muted">{{ i18n.t('statsSubtitle') }}</p>
      </div>

      @if (loading()) {
        <div class="card text-muted" role="status">{{ i18n.t('loadingCharts') }}</div>
      } @else if (error()) {
        <div class="state-box border-red-200 bg-red-50 text-red-800" role="alert">
          {{ error() }}
          <button class="btn-secondary mt-3" type="button" (click)="reload()">{{ i18n.t('tryAgain') }}</button>
        </div>
      } @else if (stats(); as s) {
        <section class="grid gap-4 sm:grid-cols-3">
          <div class="card">
            <div class="mb-2 text-primary"><svg lucideTrophy [size]="18" strokeWidth="2"></svg></div>
            <div class="text-xs text-muted">{{ i18n.t('level') }}</div>
            <div class="font-display text-3xl font-bold text-ink">{{ s.donorLevel }}</div>
          </div>
          <div class="card">
            <div class="mb-2 text-primary"><svg lucideAward [size]="18" strokeWidth="2"></svg></div>
            <div class="text-xs text-muted">XP</div>
            <div class="font-display text-3xl font-bold text-ink">{{ s.xp }}</div>
          </div>
          <div class="card">
            <div class="mb-2 text-primary"><svg lucideHeartPulse [size]="18" strokeWidth="2"></svg></div>
            <div class="text-xs text-muted">{{ i18n.t('livesHelped') }}</div>
            <div class="font-display text-3xl font-bold text-ink">{{ s.totalLivesHelped }}</div>
          </div>
        </section>

        <section class="grid gap-4 lg:grid-cols-2">
          <div class="card">
            <h2 class="mb-4 font-semibold">{{ i18n.t('donationsPerYear') }}</h2>
            <canvas #yearChart></canvas>
          </div>
          <div class="card">
            <h2 class="mb-4 font-semibold">{{ i18n.t('donationTypesChart') }}</h2>
            <canvas #typeChart></canvas>
          </div>
          <div class="card lg:col-span-2">
            <h2 class="mb-4 font-semibold">{{ i18n.t('totalBloodVolume') }}</h2>
            <canvas #volumeChart></canvas>
          </div>
        </section>

        <section class="card">
          <h2 class="mb-4 font-semibold">{{ i18n.t('achievementProgress') }}</h2>
          <div class="space-y-4">
            @for (a of s.achievements; track a.code) {
              <div>
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="font-medium">{{ a.name }}</span>
                  <span class="text-muted">{{ a.progressPercent }}%</span>
                </div>
                <div class="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    class="h-full rounded-full transition-all"
                    [style.width.%]="a.progressPercent"
                    [style.background]="a.unlocked ? '#16A34A' : '#DC2626'"
                  ></div>
                </div>
                <p class="mt-1 text-xs text-muted">{{ a.description }}</p>
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
  private readonly injector = inject(Injector);
  readonly i18n = inject(I18nService);
  private charts: Chart[] = [];

  readonly stats = signal<StatsSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.getStatsSummary().subscribe({
      next: (s) => {
        this.destroyCharts();
        this.stats.set(s);
        this.loading.set(false);
        // Wait until @if canvases exist — setTimeout(0) was racing the view.
        afterNextRender(() => this.renderCharts(s), { injector: this.injector });
      },
      error: () => {
        this.loading.set(false);
        this.stats.set(null);
        this.error.set(this.i18n.t('loadStatsError'));
      },
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
              label: this.i18n.t('chartDonations'),
              data: s.donationsPerYear.map((x) => x.count),
              backgroundColor: '#DC2626',
              borderRadius: 8,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } } },
      };
      this.charts.push(new Chart(this.yearChartRef.nativeElement, cfg));
    }

    if (this.typeChartRef) {
      const cfg: ChartConfiguration = {
        type: 'pie',
        data: {
          labels: s.donationTypes.map((x) => this.donationTypeLabel(x.type)),
          datasets: [
            {
              data: s.donationTypes.map((x) => x.count),
              backgroundColor: ['#DC2626', '#2563EB', '#16A34A'],
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true },
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
              label: this.i18n.t('cumulativeLiters'),
              data: s.volumeOverTime.map((x) => x.cumulativeLiters),
              borderColor: '#2563EB',
              backgroundColor: 'rgba(37, 99, 235, 0.15)',
              fill: true,
              tension: 0.35,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true },
      };
      this.charts.push(new Chart(this.volumeChartRef.nativeElement, cfg));
    }
  }

  private donationTypeLabel(type: string): string {
    const key = type.toLowerCase().replace(/\s+/g, '');
    if (key.includes('whole') || key.includes('volbloed') || key.includes('sang')) return this.i18n.t('wholeBlood');
    if (key.includes('plasma')) return this.i18n.t('plasma');
    if (key.includes('platelet') || key.includes('plaatjes') || key.includes('plaquette')) {
      return this.i18n.t('platelets');
    }
    return type;
  }

  private destroyCharts(): void {
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }
}
