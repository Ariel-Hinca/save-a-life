import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { LucideTrophy, LucideUserRound } from '@lucide/angular';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, LucideUserRound, LucideTrophy],
  template: `
    <div class="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 class="flex items-center gap-2 font-display text-3xl font-bold text-ink">
          <svg lucideUserRound [size]="28" strokeWidth="2"></svg>
          Profile
        </h1>
        <p class="text-muted">Keep your donor details up to date.</p>
      </div>

      @if (user(); as u) {
        <div class="card flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
            {{ u.firstName.charAt(0) }}{{ u.lastName.charAt(0) }}
          </div>
          <div>
            <div class="text-lg font-semibold text-ink">{{ u.firstName }} {{ u.lastName }}</div>
            <div class="flex items-center gap-1 text-sm text-muted">
              <svg lucideTrophy [size]="14" strokeWidth="2"></svg>
              Level {{ u.donorLevel }} · {{ u.xp }} XP
            </div>
            <div class="text-sm text-muted">{{ u.email }}</div>
          </div>
        </div>
      }

      <form class="card space-y-4" [formGroup]="form" (ngSubmit)="save()">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">First Name</label>
            <input class="input" formControlName="firstName" />
          </div>
          <div>
            <label class="label">Last Name</label>
            <input class="input" formControlName="lastName" />
          </div>
        </div>
        <div>
          <label class="label">Email</label>
          <input class="input" [value]="user()?.email || ''" disabled />
        </div>
        <div>
          <label class="label">Campus</label>
          <input class="input" formControlName="campus" />
        </div>
        <div>
          <label class="label">Programme</label>
          <input class="input" formControlName="programme" />
        </div>
        <div>
          <label class="label">Availability</label>
          <input class="input" formControlName="availability" />
        </div>

        @if (message()) {
          <div class="rounded-xl bg-green-50 px-3 py-2 text-sm text-success">{{ message() }}</div>
        }
        @if (error()) {
          <div class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</div>
        }

        <button class="btn-primary" type="submit" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Saving…' : 'Save profile' }}
        </button>
      </form>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly user = signal<User | null>(null);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    campus: [''],
    programme: [''],
    availability: [''],
  });

  ngOnInit(): void {
    this.api.getCurrentUser().subscribe({
      next: (u) => {
        this.user.set(u);
        this.auth.setUser(u);
        this.form.patchValue({
          firstName: u.firstName,
          lastName: u.lastName,
          campus: u.campus,
          programme: u.programme,
          availability: u.availability,
        });
      },
    });
  }

  save(): void {
    const current = this.user();
    if (!current || this.form.invalid) return;
    this.saving.set(true);
    this.message.set('');
    this.error.set('');
    this.api.updateUser(current.id, this.form.getRawValue()).subscribe({
      next: (u) => {
        this.user.set(u);
        this.auth.setUser(u);
        this.saving.set(false);
        this.message.set('Profile updated.');
      },
      error: () => {
        this.saving.set(false);
        this.error.set('Could not update profile.');
      },
    });
  }
}
