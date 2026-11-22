import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { createWorker, Worker } from 'tesseract.js';
import { LucideCamera, LucideScanLine, LucideUpload } from '@lucide/angular';
import { ApiService } from '../../core/services/api.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { OcrScanResponse } from '../../core/models/models';
import { LanguageSwitcherComponent } from '../../shared/language-switcher';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [ReactiveFormsModule, LucideCamera, LucideScanLine, LucideUpload, LanguageSwitcherComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 class="flex items-center gap-2 font-display text-3xl font-bold text-ink">
            <svg lucideScanLine [size]="28" strokeWidth="2"></svg>
            {{ i18n.t('scanTitle') }}
          </h1>
          <p class="max-w-2xl text-muted">{{ i18n.t('scanSubtitle') }}</p>
        </div>
        <app-language-switcher />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="card space-y-4">
          <h2 class="font-semibold text-ink">{{ i18n.t('capture') }}</h2>
          <div class="overflow-hidden rounded-2xl bg-ink">
            <video #video autoplay playsinline class="aspect-video w-full object-cover" [class.hidden]="!cameraOn()"></video>
            <canvas #canvas class="hidden"></canvas>
            @if (!cameraOn() && !previewUrl()) {
              <div class="flex aspect-video items-center justify-center px-4 text-center text-sm text-stone-300">
                {{ i18n.t('previewHint') }}
              </div>
            }
            @if (previewUrl()) {
              <img [src]="previewUrl()" alt="Captured document" class="aspect-video w-full object-contain bg-black" />
            }
          </div>

          <div class="flex flex-wrap gap-2">
            <button class="btn-primary inline-flex items-center gap-2" type="button" (click)="startCamera()" [disabled]="cameraOn()">
              <svg lucideCamera [size]="16" strokeWidth="2"></svg>
              {{ i18n.t('openCamera') }}
            </button>
            <button class="btn-secondary" type="button" (click)="capture()" [disabled]="!cameraOn()">
              {{ i18n.t('takePicture') }}
            </button>
            <label class="btn-secondary inline-flex cursor-pointer items-center gap-2">
              <svg lucideUpload [size]="16" strokeWidth="2"></svg>
              {{ i18n.t('uploadImage') }}
              <input class="hidden" type="file" accept="image/*" (change)="onFile($event)" />
            </label>
            <button
              class="btn-accent inline-flex items-center gap-2"
              type="button"
              (click)="runOcr()"
              [disabled]="!imageSource() || processing()"
            >
              <svg lucideScanLine [size]="16" strokeWidth="2"></svg>
              {{ processing() ? i18n.t('analyzing') : i18n.t('ocrAnalysis') }}
            </button>
          </div>

          @if (status()) {
            <p class="text-sm text-muted">{{ status() }}</p>
          }
          @if (rawText()) {
            <details class="rounded-xl bg-surface p-3 text-xs text-muted">
              <summary class="cursor-pointer font-semibold text-ink">{{ i18n.t('rawOcr') }}</summary>
              <pre class="mt-2 whitespace-pre-wrap">{{ rawText() }}</pre>
            </details>
          }
        </section>

        <section class="card">
          <h2 class="font-semibold text-ink">{{ i18n.t('reviewSave') }}</h2>
          <form class="mt-4 space-y-4" [formGroup]="form" (ngSubmit)="save()">
            <div>
              <label class="label">{{ i18n.t('donationId') }}</label>
              <input class="input" formControlName="donationReference" />
            </div>
            <div>
              <label class="label">{{ i18n.t('donationDate') }}</label>
              <input class="input" type="date" formControlName="donationDate" />
            </div>
            <div>
              <label class="label">{{ i18n.t('donationType') }}</label>
              <select class="input" formControlName="donationType">
                <option value="Whole Blood">{{ i18n.t('wholeBlood') }}</option>
                <option value="Plasma">{{ i18n.t('plasma') }}</option>
                <option value="Platelets">{{ i18n.t('platelets') }}</option>
              </select>
            </div>
            <div>
              <label class="label">{{ i18n.t('donationCenter') }}</label>
              <input class="input" formControlName="location" />
            </div>
            <div class="rounded-xl bg-teal-50 px-3 py-2 text-sm text-accent">
              {{ i18n.t('confidence') }}: {{ confidence() }}%
              @if (detectedLang()) {
                · {{ detectedLang().toUpperCase() }}
              }
            </div>

            <div class="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
              <div>
                <label class="label">{{ i18n.t('hemoglobin') }} (g/dL)</label>
                <input class="input" type="number" step="0.1" formControlName="hemoglobin" />
              </div>
              <div>
                <label class="label">{{ i18n.t('hematocrit') }} (%)</label>
                <input class="input" type="number" step="0.1" formControlName="hematocrit" />
              </div>
              <div>
                <label class="label">{{ i18n.t('ferritin') }}</label>
                <input class="input" type="number" step="0.1" formControlName="ferritin" />
              </div>
              <div>
                <label class="label">{{ i18n.t('bloodPressure') }}</label>
                <input class="input" formControlName="bloodPressure" placeholder="122/80" />
              </div>
              <div>
                <label class="label">{{ i18n.t('weight') }}</label>
                <input class="input" type="number" step="0.1" formControlName="weight" />
              </div>
            </div>

            @if (notes()) {
              <div class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <strong>{{ i18n.t('notes') }}:</strong> {{ notes() }}
              </div>
            }

            @if (error()) {
              <div class="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {{ error() }}
              </div>
            }
            @if (success()) {
              <div class="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-success">
                {{ success() }}
              </div>
            }

            <button class="btn-primary w-full" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? i18n.t('saving') : i18n.t('saveDonation') }}
            </button>
          </form>
        </section>
      </div>
    </div>
  `,
})
export class ScanComponent implements OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly i18n = inject(I18nService);

  private stream: MediaStream | null = null;
  private worker: Worker | null = null;

  readonly cameraOn = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly imageSource = signal<string | null>(null);
  readonly processing = signal(false);
  readonly saving = signal(false);
  readonly status = signal('');
  readonly rawText = signal('');
  readonly confidence = signal(0);
  readonly detectedLang = signal('');
  readonly notes = signal('');
  readonly error = signal('');
  readonly success = signal('');

  readonly form = this.fb.nonNullable.group({
    donationReference: [''],
    donationDate: [new Date().toISOString().slice(0, 10), Validators.required],
    donationType: ['Whole Blood', Validators.required],
    location: [''],
    hemoglobin: ['' as string | number],
    hematocrit: ['' as string | number],
    ferritin: ['' as string | number],
    bloodPressure: [''],
    weight: ['' as string | number],
  });

  async startCamera(): Promise<void> {
    this.error.set('');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      const video = this.videoRef?.nativeElement;
      if (video) {
        video.srcObject = this.stream;
        await video.play();
      }
      this.previewUrl.set(null);
      this.cameraOn.set(true);
      this.status.set(this.i18n.t('cameraReady'));
    } catch {
      this.error.set(this.i18n.t('cameraDenied'));
    }
  }

  capture(): void {
    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    this.imageSource.set(dataUrl);
    this.previewUrl.set(dataUrl);
    this.stopCamera();
    this.status.set(this.i18n.t('pictureCaptured'));
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      this.imageSource.set(result);
      this.previewUrl.set(result);
      this.stopCamera();
      this.status.set(this.i18n.t('imageUploaded'));
    };
    reader.readAsDataURL(file);
  }

  async runOcr(): Promise<void> {
    const source = this.imageSource();
    if (!source) return;
    this.processing.set(true);
    this.error.set('');
    this.notes.set('');
    this.status.set(this.i18n.t('tryingOrientations'));

    try {
      if (!this.worker) {
        this.worker = await createWorker(['nld', 'fra', 'eng']);
      }

      const variants = await this.buildOrientationVariants(source);
      let best = { text: '', confidence: -1, dataUrl: source };

      for (const variant of variants) {
        const result = await this.worker.recognize(variant.dataUrl);
        const text = result.data.text || '';
        const conf = result.data.confidence || 0;
        const score = conf + this.belgianDocBonus(text);
        if (score > best.confidence + this.belgianDocBonus(best.text)) {
          best = { text, confidence: conf, dataUrl: variant.dataUrl };
        }
      }

      this.previewUrl.set(best.dataUrl);
      this.imageSource.set(best.dataUrl);
      this.rawText.set(best.text);
      this.confidence.set(Math.round(best.confidence));
      this.status.set(this.i18n.t('parsingFields'));

      this.api.parseOcr(best.text, Math.round(best.confidence)).subscribe({
        next: (parsed) => this.applyParsed(parsed, Math.round(best.confidence)),
        error: () => {
          this.error.set(this.i18n.t('parseFailed'));
          this.processing.set(false);
        },
      });
    } catch {
      this.error.set(this.i18n.t('ocrFailed'));
      this.processing.set(false);
    }
  }

  private applyParsed(parsed: OcrScanResponse, fallbackConf: number): void {
    this.confidence.set(parsed.confidence || fallbackConf);
    this.detectedLang.set(parsed.detectedLanguage || '');
    this.notes.set(parsed.notes || '');

    if (parsed.donationId) this.form.patchValue({ donationReference: parsed.donationId });
    if (parsed.donationType) this.form.patchValue({ donationType: parsed.donationType });
    if (parsed.center) this.form.patchValue({ location: parsed.center });
    if (parsed.donationDate) {
      const parts = parsed.donationDate.split('/');
      if (parts.length === 3) {
        const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        this.form.patchValue({ donationDate: iso });
      }
    }
    if (parsed.hemoglobin != null) this.form.patchValue({ hemoglobin: parsed.hemoglobin });
    if (parsed.hematocrit != null) this.form.patchValue({ hematocrit: parsed.hematocrit });
    if (parsed.ferritin != null) this.form.patchValue({ ferritin: parsed.ferritin });
    if (parsed.bloodPressure) this.form.patchValue({ bloodPressure: parsed.bloodPressure });
    if (parsed.weight != null) this.form.patchValue({ weight: parsed.weight });

    this.status.set(this.i18n.t('reviewThenSave'));
    this.processing.set(false);
  }

  private belgianDocBonus(text: string): number {
    let bonus = 0;
    if (/(Beste Donor|Cher Donneur|Dear Donor)/i.test(text)) bonus += 20;
    if (/(Hemoglobine|Hémoglobine|Hemoglobin)/i.test(text)) bonus += 15;
    if (/(GIFT VAN|DON DU|DON DE)/i.test(text)) bonus += 15;
    if (/(Croix-Rouge|Rode Kruis|Red Cross)/i.test(text)) bonus += 10;
    if (/Ref\.?\s*[:.]?\s*\d{5,}/i.test(text)) bonus += 10;
    return bonus;
  }

  private async buildOrientationVariants(source: string): Promise<{ angle: number; dataUrl: string }[]> {
    const img = await this.loadImage(source);
    const angles = [0, 90, 180, 270];
    return angles.map((angle) => ({
      angle,
      dataUrl: this.rotateAndEnhance(img, angle),
    }));
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image load failed'));
      img.src = src;
    });
  }

  private rotateAndEnhance(img: HTMLImageElement, angle: number): string {
    const rad = (angle * Math.PI) / 180;
    const swap = angle % 180 !== 0;
    const width = swap ? img.naturalHeight : img.naturalWidth;
    const height = swap ? img.naturalWidth : img.naturalHeight;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    // Mild contrast boost helps faded lab printouts
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const contrast = 1.15;
    const intercept = 128 * (1 - contrast);
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const v = Math.min(255, Math.max(0, gray * contrast + intercept));
      data[i] = data[i + 1] = data[i + 2] = v;
    }
    ctx.putImageData(imageData, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const value = this.form.getRawValue();
    this.api
      .createDonation({
        donationDate: new Date(value.donationDate).toISOString(),
        donationType: value.donationType,
        location: value.location,
        donationReference: value.donationReference,
        status: 'Successful',
      })
      .subscribe({
        next: () => {
          const hasResults =
            value.hemoglobin !== '' ||
            value.ferritin !== '' ||
            !!value.bloodPressure ||
            value.weight !== '';
          if (hasResults) {
            this.api
              .createBloodResult({
                resultDate: new Date(value.donationDate).toISOString(),
                hemoglobin: value.hemoglobin === '' ? null : Number(value.hemoglobin),
                ferritin: value.ferritin === '' ? null : Number(value.ferritin),
                bloodPressure: value.bloodPressure || null,
                weight: value.weight === '' ? null : Number(value.weight),
              })
              .subscribe({
                next: () => this.finishSave(),
                error: () => this.finishSave(),
              });
          } else {
            this.finishSave();
          }
        },
        error: () => {
          this.saving.set(false);
          this.error.set(this.i18n.t('saveFailed'));
        },
      });
  }

  private finishSave(): void {
    this.saving.set(false);
    this.success.set(this.i18n.t('savedOk'));
    setTimeout(() => void this.router.navigateByUrl('/donations'), 700);
  }

  private stopCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.cameraOn.set(false);
  }

  ngOnDestroy(): void {
    this.stopCamera();
    void this.worker?.terminate();
  }
}
