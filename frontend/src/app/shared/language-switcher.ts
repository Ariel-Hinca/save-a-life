import { Component, inject } from '@angular/core';
import { AppLang } from '../core/i18n/translations';
import { I18nService } from '../core/i18n/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    <label class="inline-flex items-center">
      <span class="sr-only">{{ i18n.t('language') }}</span>
      <select
        class="h-8 w-[3.6rem] cursor-pointer appearance-none rounded-md border border-line bg-paper px-1.5 text-center text-xs font-semibold tracking-wide text-ink focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
