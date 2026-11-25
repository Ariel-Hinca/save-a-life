import { Injectable, computed, signal } from '@angular/core';
import { AppLang, translations } from './translations';

const LANG_KEY = 'rcdc_lang';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly langSignal = signal<AppLang>(this.readInitial());

  readonly lang = this.langSignal.asReadonly();
  readonly dict = computed(() => translations[this.langSignal()]);

  readonly options: { code: AppLang; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'nl', label: 'Nederlands' },
    { code: 'fr', label: 'Français' },
  ];

  t(key: string): string {
    return this.dict()[key] ?? translations.en[key] ?? key;
  }

  setLang(lang: AppLang): void {
    this.langSignal.set(lang);
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }

  private readInitial(): AppLang {
    const saved = localStorage.getItem(LANG_KEY) as AppLang | null;
    if (saved === 'en' || saved === 'nl' || saved === 'fr') {
      document.documentElement.lang = saved;
      return saved;
    }
    const browser = (navigator.language || 'en').toLowerCase();
    const lang: AppLang = browser.startsWith('nl') ? 'nl' : browser.startsWith('fr') ? 'fr' : 'en';
    document.documentElement.lang = lang;
    return lang;
  }
}
