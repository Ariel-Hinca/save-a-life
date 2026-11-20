import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-red-50 via-white to-surface">
      <div class="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8">
        <header class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-bold text-primary">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xl text-white"
              >+</span
            >
            Red Cross Donor Companion
          </div>
          <div class="hidden gap-3 sm:flex">
            <a routerLink="/login" class="btn-secondary">Sign In</a>
            <a routerLink="/register" class="btn-primary">Create Account</a>
          </div>
        </header>

        <section class="mt-10 grid flex-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <p class="mb-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-primary">
              Belgian donor journey, reimagined
            </p>
            <h1 class="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Donate Blood.<br /><span class="text-primary">Save Lives.</span>
            </h1>
            <p class="mt-5 max-w-xl text-lg text-slate-600">
              Track donations, unlock achievements, scan your Red Cross results with OCR, and know exactly when
              you can give again — a gamified companion beyond a simple booking portal.
            </p>
            <div class="mt-8 flex flex-wrap gap-3">
              <a routerLink="/register" class="btn-primary">Create Account</a>
              <a routerLink="/login" class="btn-secondary">Sign In</a>
            </div>
            <div class="mt-10 grid max-w-lg grid-cols-3 gap-3 text-center">
              <div class="card py-4">
                <div class="text-2xl font-bold text-primary">XP</div>
                <div class="text-xs text-slate-500">Earn rewards</div>
              </div>
              <div class="card py-4">
                <div class="text-2xl font-bold text-accent">OCR</div>
                <div class="text-xs text-slate-500">Scan results</div>
              </div>
              <div class="card py-4">
                <div class="text-2xl font-bold text-success">120d</div>
                <div class="text-xs text-slate-500">Eligibility</div>
              </div>
            </div>
          </div>

          <div class="relative">
            <div class="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-red-200/60 to-blue-100/60 blur-2xl"></div>
            <div class="relative card overflow-hidden p-0">
              <div class="bg-primary px-6 py-8 text-white">
                <p class="text-sm opacity-90">Donor Level 5</p>
                <h2 class="mt-1 text-3xl font-bold">12 Donations</h2>
                <p class="mt-2 text-red-100">36 lives impacted · 5.4 liters donated</p>
              </div>
              <div class="space-y-3 p-6">
                <div class="rounded-xl bg-slate-50 p-4">
                  <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Next donation</div>
                  <div class="mt-1 text-lg font-semibold text-slate-800">December 15, 2026</div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-xl border border-slate-100 p-4">
                    <div class="text-xs text-slate-400">Hemoglobin</div>
                    <div class="text-xl font-bold">14.5 g/dL</div>
                  </div>
                  <div class="rounded-xl border border-slate-100 p-4">
                    <div class="text-xs text-slate-400">Ferritin</div>
                    <div class="text-xl font-bold">52 µg/L</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <p class="mt-8 text-center text-xs text-slate-400">
          Unofficial portfolio demo — not affiliated with the Belgian Red Cross / Rode Kruis.
        </p>
      </div>
    </div>
  `,
})
export class WelcomeComponent {}
