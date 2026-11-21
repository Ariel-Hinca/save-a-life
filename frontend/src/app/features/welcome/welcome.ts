import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen">
      <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-xl text-white"
              aria-hidden="true"
              >+</span
            >
            <div>
              <div class="font-semibold text-ink">Donor Companion</div>
              <div class="text-xs text-muted">Unofficial portfolio demo</div>
            </div>
          </div>
          <div class="hidden gap-3 sm:flex">
            <a routerLink="/login" class="btn-secondary">Sign In</a>
            <a routerLink="/register" class="btn-primary">Create Account</a>
          </div>
        </header>

        <section class="mt-14 grid flex-1 items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p class="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Belgian donor journey
            </p>
            <h1 class="font-display text-5xl font-bold leading-[1.05] text-ink sm:text-6xl">
              Donate blood.<br />
              Keep the story going.
            </h1>
            <p class="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Track donations, scan paper results with OCR, follow health metrics, and know when you
              can give again — a companion beyond a booking form.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a routerLink="/register" class="btn-primary">Create Account</a>
              <a routerLink="/login" class="btn-secondary">Sign In</a>
            </div>

            <dl class="mt-12 grid max-w-xl grid-cols-3 gap-4 border-t border-line pt-6">
              <div>
                <dt class="text-xs uppercase tracking-wide text-muted">Progress</dt>
                <dd class="mt-1 font-display text-2xl font-semibold text-primary">XP & levels</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide text-muted">Capture</dt>
                <dd class="mt-1 font-display text-2xl font-semibold text-ink">OCR scan</dd>
              </div>
              <div>
                <dt class="text-xs uppercase tracking-wide text-muted">Cadence</dt>
                <dd class="mt-1 font-display text-2xl font-semibold text-accent">120 days</dd>
              </div>
            </dl>
          </div>

          <aside class="card overflow-hidden p-0" aria-label="Product preview">
            <div class="bg-ink px-6 py-8 text-paper">
              <p class="text-sm text-stone-300">Donor Level 5</p>
              <h2 class="mt-2 font-display text-4xl font-bold">12 donations</h2>
              <p class="mt-3 text-sm text-stone-300">36 lives impacted · 5.4 liters</p>
            </div>
            <div class="space-y-3 p-6">
              <div class="rounded-xl bg-surface px-4 py-3">
                <div class="text-xs font-semibold uppercase tracking-wide text-muted">Next donation</div>
                <div class="mt-1 text-lg font-semibold text-ink">15 December 2026</div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-xl border border-line px-4 py-3">
                  <div class="text-xs text-muted">Hemoglobin</div>
                  <div class="font-display text-2xl font-semibold">14.5</div>
                  <div class="text-xs text-muted">g/dL</div>
                </div>
                <div class="rounded-xl border border-line px-4 py-3">
                  <div class="text-xs text-muted">Ferritin</div>
                  <div class="font-display text-2xl font-semibold">52</div>
                  <div class="text-xs text-muted">µg/L</div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <p class="mt-10 text-center text-xs text-muted">
          Not affiliated with the Belgian Red Cross / Rode Kruis.
        </p>
      </div>
    </div>
  `,
})
export class WelcomeComponent {}
