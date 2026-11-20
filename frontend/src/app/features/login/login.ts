import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div class="w-full max-w-md">
        <a routerLink="/" class="mb-6 inline-flex items-center gap-2 font-bold text-primary">
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">+</span>
          Donor Companion
        </a>
        <div class="card">
          <h1 class="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p class="mt-1 text-sm text-slate-500">Sign in to continue your donor journey.</p>

          <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
            <div>
              <label class="label" for="email">Email</label>
              <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
            </div>
            <div>
              <label class="label" for="password">Password</label>
              <input
                id="password"
                class="input"
                type="password"
                formControlName="password"
                autocomplete="current-password"
              />
            </div>

            @if (error()) {
              <div class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</div>
            }

            <button class="btn-primary w-full" type="submit" [disabled]="form.invalid || loading()">
              {{ loading() ? 'Signing in…' : 'Login' }}
            </button>
          </form>

          <p class="mt-4 text-center text-sm text-slate-500">
            No account?
            <a routerLink="/register" class="font-semibold text-primary">Create Account</a>
          </p>
          <p class="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
            Demo: <span class="font-medium text-slate-700">donor&#64;demo.be</span> / Demo123!
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
        this.error.set(err?.error?.message || 'Login failed. Check your credentials.');
      },
    });
  }
}
