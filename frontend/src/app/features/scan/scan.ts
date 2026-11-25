import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LucideCamera, LucideScanLine, LucideUpload } from '@lucide/angular';
import { ApiService } from '../../core/services/api.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { OcrScanResponse } from '../../core/models/models';
import {
  mergeOcrResults,
  normalizeOcrResponse,
  parseBelgianRedCrossOcr,
} from '../../core/services/belgian-ocr-parser';
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

      <div class="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-accent">
        {{ i18n.t('privacyNote') }}
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
              (click)="runExtract()"
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
              @if (method()) {
                · {{ method() }}
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
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly i18n = inject(I18nService);

  private stream: MediaStream | null = null;

  readonly cameraOn = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly imageSource = signal<string | null>(null);
  readonly processing = signal(false);
  readonly saving = signal(false);
  readonly status = signal('');
  readonly rawText = signal('');
  readonly confidence = signal(0);
  readonly detectedLang = signal('');
  readonly method = signal('');
  readonly notes = signal('');
  readonly error = signal('');
  readonly success = signal('');

  readonly form = this.fb.group({
    donationReference: [''],
    donationDate: [new Date().toISOString().slice(0, 10), Validators.required],
    donationType: ['Whole Blood', Validators.required],
    location: [''],
    hemoglobin: this.fb.control<number | null>(null),
    hematocrit: this.fb.control<number | null>(null),
    ferritin: this.fb.control<number | null>(null),
    bloodPressure: [''],
    weight: this.fb.control<number | null>(null),
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

  async runExtract(): Promise<void> {
    const source = this.imageSource();
    if (!source) return;
    this.processing.set(true);
    this.error.set('');
    this.notes.set('');
    this.status.set(this.i18n.t('tryingOrientations'));

    try {
      const mime = source.startsWith('data:')
        ? source.slice(5, source.indexOf(';')) || 'image/jpeg'
        : 'image/jpeg';

      const remoteRaw = await firstValueFrom(this.api.extractDocument(source, mime));
      const remote = normalizeOcrResponse(remoteRaw as unknown as Record<string, unknown>);
      const local = parseBelgianRedCrossOcr(remote.rawText || '', remote.confidence || 0);
      const parsed = mergeOcrResults(remote, local);

      this.zone.run(() => {
        this.rawText.set(parsed.rawText || remote.rawText || '');
        this.method.set(parsed.extractionMethod || 'local-tesseract');
        this.applyParsed(parsed, parsed.confidence || 0);
      });
    } catch {
      this.zone.run(() => {
        this.error.set(this.i18n.t('ocrFailed'));
        this.processing.set(false);
        this.cdr.detectChanges();
      });
    }
  }

  private applyParsed(parsed: OcrScanResponse, fallbackConf: number): void {
    this.confidence.set(parsed.confidence || fallbackConf);
    this.detectedLang.set(parsed.detectedLanguage || '');
    this.notes.set(parsed.notes || '');

    const filledLabels: string[] = [];

    const setCtrl = (name: string, value: string | number, label: string) => {
      const ctrl = this.form.get(name);
      if (!ctrl) return;
      ctrl.setValue(value, { emitEvent: true });
      ctrl.markAsDirty();
      ctrl.markAsTouched();
      filledLabels.push(label);
    };

    if (parsed.donationId) setCtrl('donationReference', parsed.donationId, 'reference');
    if (parsed.donationType) setCtrl('donationType', parsed.donationType, 'type');
    if (parsed.center) setCtrl('location', parsed.center, 'center');
    if (parsed.donationDate) {
      const iso = toIsoDate(parsed.donationDate);
      if (iso) setCtrl('donationDate', iso, 'date');
    }
    if (parsed.hemoglobin != null) setCtrl('hemoglobin', Number(parsed.hemoglobin), 'hemoglobin');
    if (parsed.hematocrit != null) setCtrl('hematocrit', Number(parsed.hematocrit), 'hematocrit');
    if (parsed.ferritin != null) setCtrl('ferritin', Number(parsed.ferritin), 'ferritin');
    if (parsed.bloodPressure) setCtrl('bloodPressure', parsed.bloodPressure, 'blood pressure');
    if (parsed.weight != null) setCtrl('weight', Number(parsed.weight), 'weight');

    this.form.updateValueAndValidity({ emitEvent: true });
    this.cdr.detectChanges();

    this.status.set(
      filledLabels.length > 0
        ? `${this.i18n.t('reviewThenSave')} (${filledLabels.length}: ${filledLabels.join(', ')})`
        : this.i18n.t('reviewThenSave')
    );
    this.processing.set(false);
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const value = this.form.getRawValue();
    const donationDate = value.donationDate || new Date().toISOString().slice(0, 10);
    this.api
      .createDonation({
        donationDate: new Date(donationDate).toISOString(),
        donationType: value.donationType || 'Whole Blood',
        location: value.location || '',
        donationReference: value.donationReference || '',
        status: 'Successful',
      })
      .subscribe({
        next: () => {
          const hasResults =
            value.hemoglobin != null ||
            value.ferritin != null ||
            !!value.bloodPressure ||
            value.weight != null;
          if (hasResults) {
            this.api
              .createBloodResult({
                resultDate: new Date(donationDate).toISOString(),
                hemoglobin: value.hemoglobin,
                ferritin: value.ferritin,
                bloodPressure: value.bloodPressure || null,
                weight: value.weight,
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
  }
}

function toIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/[/.-]/);
  if (parts.length !== 3) return null;
  let [d, m, y] = parts;
  if (y.length === 2) y = `20${y}`;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

