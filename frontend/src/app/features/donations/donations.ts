import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDroplet, LucideMapPin, LucidePlus, LucideTrash } from '@lucide/angular';
import { ApiService } from '../../core/services/api.service';
import { Donation } from '../../core/models/models';

@Component({
  selector: 'app-donations',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, LucidePlus, LucideDroplet, LucideMapPin, LucideTrash],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="flex items-center gap-2 font-display text-3xl font-bold text-ink">
            <svg lucideDroplet [size]="28" strokeWidth="2"></svg>
            Donation history
          </h1>
          <p class="text-muted">Every drop counts. Review and add donations manually.</p>
        </div>
        <button class="btn-primary inline-flex items-center gap-2" type="button" (click)="showForm.set(!showForm())">
          <svg lucidePlus [size]="16" strokeWidth="2"></svg>
          {{ showForm() ? 'Close form' : 'Add donation' }}
        </button>
      </div>

      @if (showForm()) {
        <form class="card grid gap-4 md:grid-cols-2" [formGroup]="form" (ngSubmit)="create()">
          <div>
            <label class="label">Date</label>
            <input class="input" type="date" formControlName="donationDate" />
          </div>
          <div>
            <label class="label">Type</label>
            <select class="input" formControlName="donationType">
              <option>Whole Blood</option>
              <option>Plasma</option>
              <option>Platelets</option>
            </select>
          </div>
          <div>
            <label class="label">Location</label>
            <input class="input" formControlName="location" placeholder="Brussels" />
          </div>
          <div>
            <label class="label">Reference</label>
            <input class="input" formControlName="donationReference" placeholder="DON-2026-00124" />
          </div>
          <button class="btn-primary md:col-span-2" type="submit" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Saving…' : 'Save donation' }}
          </button>
        </form>
      }

      @if (loading()) {
        <div class="state-box" role="status">Loading donations…</div>
      } @else if (!donations().length) {
        <div class="state-box flex flex-col items-center gap-3 text-center">
          <span class="icon-chip"><svg lucideDroplet [size]="18" strokeWidth="2"></svg></span>
          No donations yet. Scan a document or add one manually.
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-2">
          @for (d of donations(); track d.id) {
            <article class="card">
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <span class="icon-chip"><svg lucideDroplet [size]="18" strokeWidth="2"></svg></span>
                  <div>
                    <div class="text-lg font-bold text-ink">{{ d.donationType }}</div>
                    <div class="text-sm text-muted">{{ d.donationDate | date: 'd MMMM y' }}</div>
                  </div>
                </div>
                <span class="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-success">{{
                  d.status
                }}</span>
              </div>
              <div class="mt-4 space-y-2 text-sm text-muted">
                <div class="flex items-center gap-2">
                  <svg lucideMapPin [size]="14" strokeWidth="2"></svg>
                  {{ d.location || 'Donation center' }}
                </div>
                <div class="font-mono text-xs">{{ d.donationReference }}</div>
                <div>{{ d.volume }} ml</div>
              </div>
              <button
                class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                type="button"
                (click)="remove(d.id)"
              >
                <svg lucideTrash [size]="14" strokeWidth="2"></svg>
                Delete
              </button>
            </article>
          }
        </div>
      }
    </div>
  `,
})
export class DonationsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly donations = signal<Donation[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);

  readonly form = this.fb.nonNullable.group({
    donationDate: [new Date().toISOString().slice(0, 10), Validators.required],
    donationType: ['Whole Blood', Validators.required],
    location: ['Brussels'],
    donationReference: [''],
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.api.getDonations().subscribe({
      next: (items) => {
        this.donations.set(items);
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
      .createDonation({
        ...value,
        donationDate: new Date(value.donationDate).toISOString(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.showForm.set(false);
          this.form.patchValue({ donationReference: '' });
          this.reload();
        },
        error: () => this.saving.set(false),
      });
  }

  remove(id: string): void {
    this.api.deleteDonation(id).subscribe({ next: () => this.reload() });
  }
}
