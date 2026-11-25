import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDroplet } from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitcherComponent } from '../../shared/language-switcher';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideDroplet, LanguageSwitcherComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center px-4 py-10">
      <div class="w-full max-w-lg">
        <div class="mb-6 flex items-center justify-between gap-3">
          <a routerLink="/" class="inline-flex items-center gap-2 font-semibold text-ink">
            <span class="icon-chip" aria-hidden="true"><svg lucideDroplet [size]="18" strokeWidth="2"></svg></span>
            {{ i18n.t('appName') }}
          </a>
          <app-language-switcher />
        </div>
        <div class="card">
          <h1 class="font-display text-3xl font-bold text-ink">{{ i18n.t('registerTitle') }}</h1>
          <p class="mt-1 text-sm text-muted">{{ i18n.t('registerSubtitle') }}</p>

          <form class="mt-6 grid gap-4 sm:grid-cols-2" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label class="label" for="firstName">{{ i18n.t('firstName') }}</label>
              <input id="firstName" class="input" formControlName="firstName" />
            </div>
            <div>
              <label class="label" for="lastName">{{ i18n.t('lastName') }}</label>
              <input id="lastName" class="input" formControlName="lastName" />
            </div>
            <div class="sm:col-span-2">
              <label class="label" for="email">{{ i18n.t('email') }}</label>
              <input id="email" class="input" type="email" formControlName="email" />
            </div>
            <div class="sm:col-span-2">
              <label class="label" for="password">{{ i18n.t('password') }}</label>
              <input id="password" class="input" type="password" formControlName="password" />
            </div>
            <div>
              <label class="label" for="campus">{{ i18n.t('campus') }}</label>
              <input id="campus" class="input" formControlName="campus" placeholder="Brussels" />
            </div>
            <div>
              <label class="label" for="programme">{{ i18n.t('programme') }}</label>
              <input id="programme" class="input" formControlName="programme" placeholder="Healthcare" />
            </div>
            <div class="sm:col-span-2">
              <label class="label" for="availability">{{ i18n.t('availability') }}</label>
              <input id="availability" class="input" formControlName="availability" placeholder="Weekends" />
            </div>

            @if (error()) {
              <div class="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</div>
            }

            <button class="btn-primary sm:col-span-2" type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? i18n.t('creating') : i18n.t('createAccount') }}
            </button>
          </form>

          <p class="mt-4 text-center text-sm text-slate-500">
            {{ i18n.t('alreadyRegistered') }}
            <a routerLink="/login" class="font-semibold text-primary">{{ i18n.t('signIn') }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    campus: [''],
    programme: [''],
    availability: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || this.i18n.t('registrationFailed'));
      },
    });
  }
}
