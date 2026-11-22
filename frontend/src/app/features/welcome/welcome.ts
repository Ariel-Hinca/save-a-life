import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideCalendarClock,
  LucideDroplet,
  LucideHeartPulse,
  LucideScanLine,
  LucideTrophy,
} from '@lucide/angular';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink, LucideDroplet, LucideTrophy, LucideScanLine, LucideCalendarClock, LucideHeartPulse],
  template: `
    <div class="min-h-screen">
      <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="icon-chip" aria-hidden="true">
              <svg lucideDroplet [size]="18" strokeWidth="2"></svg>
            </span>
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

            <ul class="mt-12 grid max-w-xl gap-4 border-t border-line pt-6 sm:grid-cols-3">
              <li class="flex items-start gap-3">
                <span class="icon-chip"><svg lucideTrophy [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="font-semibold text-ink">XP & levels</div>
                  <div class="text-sm text-muted">Stay motivated</div>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="icon-chip"><svg lucideScanLine [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="font-semibold text-ink">OCR scan</div>
                  <div class="text-sm text-muted">Digitize papers</div>
                </div>
              </li>
              <li class="flex items-start gap-3">
                <span class="icon-chip"><svg lucideCalendarClock [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="font-semibold text-ink">120-day cadence</div>
                  <div class="text-sm text-muted">Know when next</div>
                </div>
              </li>
            </ul>
          </div>

          <aside class="card overflow-hidden p-0" aria-label="Product preview">
            <div class="bg-ink px-6 py-8 text-paper">
              <div class="flex items-center gap-2 text-sm text-stone-300">
                <svg lucideHeartPulse [size]="16" strokeWidth="2"></svg>
                Donor Level 5
              </div>
              <h2 class="mt-2 font-display text-4xl font-bold">12 donations</h2>
              <p class="mt-3 text-sm text-stone-300">36 lives impacted · 5.4 liters</p>
            </div>
            <div class="space-y-3 p-6">
              <div class="flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
                <span class="icon-chip"><svg lucideCalendarClock [size]="18" strokeWidth="2"></svg></span>
                <div>
                  <div class="text-xs font-semibold uppercase tracking-wide text-muted">Next donation</div>
                  <div class="mt-0.5 text-lg font-semibold text-ink">15 December 2026</div>
                </div>
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
