import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideDroplet, LucideLock, LucideMail } from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { LanguageSwitcherComponent } from '../../shared/language-switcher';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LucideDroplet, LucideMail, LucideLock, LanguageSwitcherComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center px-4 py-10">
      <div class="w-full max-w-md">
        <div class="mb-6 flex items-center justify-between gap-3">
          <a routerLink="/" class="inline-flex items-center gap-2 font-semibold text-ink">
            <span class="icon-chip" aria-hidden="true">
              <svg lucideDroplet [size]="18" strokeWidth="2"></svg>
            </span>
            {{ i18n.t('appName') }}
          </a>
          <app-language-switcher />
        </div>
        <div class="card">
          <h1 class="font-display text-3xl font-bold text-ink">{{ i18n.t('loginTitle') }}</h1>
          <p class="mt-1 text-sm text-muted">{{ i18n.t('loginSubtitle') }}</p>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label class="label" for="email">{{ i18n.t('email') }}</label>
              <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                  <svg lucideMail [size]="16" strokeWidth="2"></svg>
                </span>
                <input id="email" class="input pl-10" type="email" formControlName="email" autocomplete="email" />
              </div>
            </div>
            <div>
              <label class="label" for="password">{{ i18n.t('password') }}</label>
              <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
                  <svg lucideLock [size]="16" strokeWidth="2"></svg>
                </span>
                <input
                  id="password"
                  class="input pl-10"
                  type="password"
                  formControlName="password"
                  autocomplete="current-password"
                />
              </div>
            </div>

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {{ error() }}
              </div>
            }

            <button class="btn-primary w-full" type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? i18n.t('signingIn') : i18n.t('login') }}
            </button>
          </form>

          <p class="mt-4 text-center text-sm text-muted">
            {{ i18n.t('noAccount') }}
            <a routerLink="/register" class="font-semibold text-primary">{{ i18n.t('createAccount') }}</a>
          </p>
          <p class="mt-3 rounded-xl bg-surface p-3 text-xs text-muted">
            {{ i18n.t('demoHint') }}:
            <span class="font-medium text-ink">donor&#64;demo.be</span> / Demo123!
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  readonly loading = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Login failed.');
      },
    });
  }
}
