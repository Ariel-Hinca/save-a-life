import { Component, inject } from '@angular/core';
import { I18nService } from '../core/i18n/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    <div
      class="lang-switch inline-flex items-center rounded-md border border-line bg-paper p-0.5"
      role="group"
      [attr.aria-label]="i18n.t('language')"
    >
      @for (opt of i18n.options; track opt.code) {
        <button
          type="button"
          class="min-w-[2.25rem] rounded px-1.5 py-1 text-[11px] font-semibold tracking-wide transition"
          [class.bg-ink]="i18n.lang() === opt.code"
          [class.text-paper]="i18n.lang() === opt.code"
          [class.text-muted]="i18n.lang() !== opt.code"
          [class.hover:text-ink]="i18n.lang() !== opt.code"
          [attr.aria-pressed]="i18n.lang() === opt.code"
          (click)="i18n.setLang(opt.code)"
        >
          {{ opt.label }}
        </button>
      }
    </div>
  `,
})
export class LanguageSwitcherComponent {
  readonly i18n = inject(I18nService);
}
