import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { createWorker, Worker } from 'tesseract.js';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold">OCR Scan</h1>
        <p class="text-slate-500">Capture a Red Cross donation document and extract the details.</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="card space-y-4">
          <h2 class="font-semibold">1. Capture</h2>
          <div class="overflow-hidden rounded-2xl bg-slate-900">
            <video #video autoplay playsinline class="aspect-video w-full object-cover" [class.hidden]="!cameraOn()"></video>
            <canvas #canvas class="hidden"></canvas>
            @if (!cameraOn() && !previewUrl()) {
              <div class="flex aspect-video items-center justify-center text-sm text-slate-300">
                Camera preview or uploaded image will appear here
              </div>
            }
            @if (previewUrl()) {
              <img [src]="previewUrl()" alt="Captured document" class="aspect-video w-full object-contain bg-black" />
            }
          </div>

          <div class="flex flex-wrap gap-2">
            <button class="btn-primary" type="button" (click)="startCamera()" [disabled]="cameraOn()">
              Open camera
            </button>
            <button class="btn-secondary" type="button" (click)="capture()" [disabled]="!cameraOn()">
              Take picture
            </button>
            <label class="btn-secondary cursor-pointer">
              Upload image
              <input class="hidden" type="file" accept="image/*" (change)="onFile($event)" />
            </label>
            <button class="btn-accent" type="button" (click)="runOcr()" [disabled]="!imageSource() || processing()">
              {{ processing() ? 'Analyzing…' : 'OCR Analysis' }}
            </button>
          </div>

          @if (status()) {
            <p class="text-sm text-slate-500">{{ status() }}</p>
          }
          @if (rawText()) {
            <details class="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <summary class="cursor-pointer font-semibold">Raw OCR text</summary>
              <pre class="mt-2 whitespace-pre-wrap">{{ rawText() }}</pre>
            </details>
          }
        </section>

        <section class="card">
          <h2 class="font-semibold">2. Review & save</h2>
          <form class="mt-4 space-y-4" [formGroup]="form" (ngSubmit)="save()">
            <div>
              <label class="label">Donation ID</label>
              <input class="input" formControlName="donationReference" />
            </div>
            <div>
              <label class="label">Donation Date</label>
              <input class="input" type="date" formControlName="donationDate" />
            </div>
            <div>
              <label class="label">Donation Type</label>
              <select class="input" formControlName="donationType">
                <option>Whole Blood</option>
                <option>Plasma</option>
                <option>Platelets</option>
              </select>
            </div>
            <div>
              <label class="label">Donation Center</label>
              <input class="input" formControlName="location" />
            </div>
            <div class="rounded-xl bg-blue-50 px-3 py-2 text-sm text-accent">
              Confidence: {{ confidence() }}%
            </div>

            <div class="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
              <div>
                <label class="label">Hemoglobin (optional)</label>
                <input class="input" type="number" step="0.1" formControlName="hemoglobin" />
              </div>
              <div>
                <label class="label">Ferritin (optional)</label>
                <input class="input" type="number" step="0.1" formControlName="ferritin" />
              </div>
              <div>
                <label class="label">Blood pressure</label>
                <input class="input" formControlName="bloodPressure" placeholder="122/80" />
              </div>
              <div>
                <label class="label">Weight (kg)</label>
                <input class="input" type="number" step="0.1" formControlName="weight" />
              </div>
            </div>

            @if (error()) {
              <div class="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{{ error() }}</div>
            }
            @if (success()) {
              <div class="rounded-xl bg-green-50 px-3 py-2 text-sm text-success">{{ success() }}</div>
            }

            <button class="btn-primary w-full" type="submit" [disabled]="form.invalid || saving()">
              {{ saving() ? 'Saving…' : 'Save donation' }}
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
  readonly error = signal('');
  readonly success = signal('');

  readonly form = this.fb.nonNullable.group({
    donationReference: [''],
    donationDate: [new Date().toISOString().slice(0, 10), Validators.required],
    donationType: ['Whole Blood', Validators.required],
    location: [''],
    hemoglobin: ['' as string | number],
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
      this.status.set('Camera ready — capture your document.');
    } catch {
      this.error.set('Camera access denied or unavailable. Upload an image instead.');
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
    this.status.set('Picture captured. Run OCR analysis.');
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
      this.status.set('Image uploaded. Run OCR analysis.');
    };
    reader.readAsDataURL(file);
  }

  async runOcr(): Promise<void> {
    const source = this.imageSource();
    if (!source) return;
    this.processing.set(true);
    this.error.set('');
    this.status.set('Running Tesseract.js OCR…');
    try {
      if (!this.worker) {
        this.worker = await createWorker('eng');
      }
      const result = await this.worker.recognize(source);
      const text = result.data.text || '';
      const conf = Math.round(result.data.confidence || 0);
      this.rawText.set(text);
      this.confidence.set(conf);
      this.status.set('Parsing extracted fields…');

      this.api.parseOcr(text, conf).subscribe({
        next: (parsed) => {
          this.confidence.set(parsed.confidence || conf);
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
          this.status.set('Review the extracted information, then save.');
          this.processing.set(false);
        },
        error: () => {
          this.error.set('OCR parse API failed.');
          this.processing.set(false);
        },
      });
    } catch {
      this.error.set('OCR processing failed.');
      this.processing.set(false);
    }
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
          this.error.set('Could not save donation.');
        },
      });
  }

  private finishSave(): void {
    this.saving.set(false);
    this.success.set('Donation saved successfully.');
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
