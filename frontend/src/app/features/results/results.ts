import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { BloodResult } from '../../core/models/models';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-3xl font-bold">Blood test results</h1>
          <p class="text-slate-500">Track hemoglobin, ferritin, blood pressure and weight over time.</p>
        </div>
        <button class="btn-primary" type="button" (click)="showForm.set(!showForm())">
          {{ showForm() ? 'Close' : 'Add result' }}
        </button>
      </div>

      @if (latest(); as l) {
        <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="card">
            <div class="text-xs uppercase tracking-wide text-slate-400">Hemoglobin</div>
            <div class="mt-2 text-3xl font-bold text-slate-900">{{ l.hemoglobin ?? '—' }} <span class="text-sm font-medium text-slate-400">g/dL</span></div>
          </div>
          <div class="card">
            <div class="text-xs uppercase tracking-wide text-slate-400">Ferritin</div>
            <div class="mt-2 text-3xl font-bold text-slate-900">{{ l.ferritin ?? '—' }} <span class="text-sm font-medium text-slate-400">µg/L</span></div>
          </div>
          <div class="card">
            <div class="text-xs uppercase tracking-wide text-slate-400">Blood Pressure</div>
            <div class="mt-2 text-3xl font-bold text-slate-900">{{ l.bloodPressure || '—' }}</div>
          </div>
          <div class="card">
            <div class="text-xs uppercase tracking-wide text-slate-400">Weight</div>
            <div class="mt-2 text-3xl font-bold text-slate-900">{{ l.weight ?? '—' }} <span class="text-sm font-medium text-slate-400">kg</span></div>
          </div>
        </section>
      }

      @if (showForm()) {
        <form class="card grid gap-4 md:grid-cols-2" [formGroup]="form" (ngSubmit)="create()">
          <div>
            <label class="label">Date</label>
            <input class="input" type="date" formControlName="resultDate" />
          </div>
          <div>
            <label class="label">Hemoglobin</label>
            <input class="input" type="number" step="0.1" formControlName="hemoglobin" />
          </div>
          <div>
            <label class="label">Ferritin</label>
            <input class="input" type="number" step="0.1" formControlName="ferritin" />
          </div>
          <div>
            <label class="label">Blood pressure</label>
            <input class="input" formControlName="bloodPressure" placeholder="122/80" />
          </div>
          <div>
            <label class="label">Weight</label>
            <input class="input" type="number" step="0.1" formControlName="weight" />
          </div>
          <button class="btn-primary md:col-span-2" type="submit" [disabled]="form.invalid || saving()">Save result</button>
        </form>
      }

      <section class="space-y-3">
        <h2 class="text-lg font-semibold">History</h2>
        @if (loading()) {
          <div class="card text-slate-500">Loading…</div>
        } @else if (!results().length) {
          <div class="card text-slate-500">No results yet. Add one or scan a document.</div>
        } @else {
          @for (r of results(); track r.id) {
            <article class="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <div class="font-semibold">{{ r.resultDate | date: 'MMMM d y' }}</div>
                <div class="text-sm text-slate-500">
                  Hb {{ r.hemoglobin ?? '—' }} · Ferritin {{ r.ferritin ?? '—' }} · BP {{ r.bloodPressure || '—' }} ·
                  {{ r.weight ?? '—' }} kg
                </div>
              </div>
            </article>
          }
        }
      </section>
    </div>
  `,
})
export class ResultsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly results = signal<BloodResult[]>([]);
  readonly latest = signal<BloodResult | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);

  readonly form = this.fb.nonNullable.group({
    resultDate: [new Date().toISOString().slice(0, 10), Validators.required],
    hemoglobin: [14.5],
    ferritin: [50],
    bloodPressure: ['120/80'],
    weight: [70],
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.getBloodResults().subscribe({
      next: (items) => {
        this.results.set(items);
        this.latest.set(items[0] || null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  create(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.api
      .createBloodResult({
        ...value,
        resultDate: new Date(value.resultDate).toISOString(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.reload();
        },
        error: () => this.saving.set(false),
      });
  }
}
