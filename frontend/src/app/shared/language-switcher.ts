import { Component, inject } from '@angular/core';
import { LucideLanguages } from '@lucide/angular';
import { AppLang } from '../core/i18n/translations';
import { I18nService } from '../core/i18n/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [LucideLanguages],
  template: `
    <label class="inline-flex items-center gap-2 text-sm text-muted">
      <svg lucideLanguages [size]="16" strokeWidth="2" aria-hidden="true"></svg>
      <span class="sr-only">{{ i18n.t('language') }}</span>
      <select
        class="rounded-lg border border-line bg-paper px-2 py-1.5 text-sm font-medium text-ink focus:border-primary focus:ring-primary"
        [value]="i18n.lang()"
        (change)="onChange($event)"
        [attr.aria-label]="i18n.t('language')"
      >
        @for (opt of i18n.options; track opt.code) {
          <option [value]="opt.code">{{ opt.label }}</option>
        }
      </select>
    </label>
  `,
})
export class LanguageSwitcherComponent {
  readonly i18n = inject(I18nService);

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AppLang;
    this.i18n.setLang(value);
  }
}
