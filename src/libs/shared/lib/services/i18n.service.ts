import {
  Injectable, Signal, WritableSignal, computed, inject, isDevMode, signal
} from '@angular/core';
import { APP_INFO, AppInfo } from '../models/app-info.model';
import { COMMON_I18N_SRV_LANGUAGE } from '../models/keys.model';
import { JSON_DICTIONARY } from '../models/urls.model';
import { logException } from '../models/utils.model';
import { ConfigService } from './config.service';
import { StorageService } from './storage.service';
import { WaitService } from './wait.service';

/**
 * Typ pro slovnik
 */
export type Dictionary = Record<string, Translation>;

/**
 * Typ pro preklad klicu v danem jazyce
 */
export type Translation = Record<string, string>;

/**
 * Typ vlastnosti pro Proxy
 */
export type ProxyProperty = string | number | symbol;

/**
 * Sluzba zajistujici lokalizaci aplikace
 */
@Injectable({
  providedIn: 'root'
})
export class I18nService {

  /**
   * Informace o aplikaci
   */
  private __appInfo: AppInfo = inject<AppInfo>(APP_INFO);

  /**
   * Sluzba pro nacteni konfigurace aplikace
   */
  private __configSrv: ConfigService = inject<ConfigService>(ConfigService);

  /**
   * Sluzba pro ukladani dat do lokalniho uloziste
   */
  private __storageSrv: StorageService = inject<StorageService>(StorageService);

  /**
   * Sluzba pro vyckavani
   */
  private __waitSrv: WaitService = inject<WaitService>(WaitService);

  /**
   * Slovnik
   */
  private __dictionary: Dictionary = {};

  /**
   * Signal nactenych slovniku
   */
  private __dictionarySg: WritableSignal<Dictionary> = signal<Dictionary>(this.__dictionary);

  /**
   * Signal aktualniho jazyka aplikace
   */
  private __languageSg: WritableSignal<string> = signal<string>(this.__configSrv.defaultLanguage);

  /**
   * Signal dostupnych jazyku
   */
  private __languagesSg: Signal<readonly string[]> = computed<readonly string[]>(() => {
    return this.__configSrv.configSg()?.AvailableLanguages ?? Object.freeze([this.__configSrv.defaultLanguage]);
  });

  /**
   * Preklady
   */
  private __translationsSg: Signal<Translation> = computed<Translation>(() => {
    const
      dictionary = this.__dictionarySg(),
      language = this.__languageSg()
    ;
    if (dictionary && language) {
      return Object.entries(dictionary).reduce((acc: Translation, [key, value]: [string, Translation]) => {
        return language in value ? {...acc, [key]: value[language]} as Translation : acc;
      }, {} as Translation);
    }
    return {} as Translation;
  });

  /**
   * Jiz zobrazena varovani
   */
  private __warnings: string[] = [];

  /**
   * Getter aktualniho jazyka
   */
  public get language(): string {
    return this.__languageSg();
  }

  /**
   * Setter aktualniho jazyka
   */
  public set language(value: string) {
    this.__setLanguage(value);
  }

  /**
   * Getter signalu aktualniho jazyka
   */
  public get languageSg(): Signal<string> {
    return this.__languageSg;
  }

  /**
   * Getter signalu dostupnych jazyku
   */
  public get languagesSg(): Signal<readonly string[]> {
    return this.__languagesSg;
  }

  /**
   * Getter prekladu
   */
  public get translations(): Translation {
    return this.__translationsSg();
  }

  /**
   * Getter signalu prekladu
   */
  public get translationsSg(): Signal<Translation> {
    return this.__translationsSg;
  }

  /**
   * Formatovani parametru do prekladu
   */
  public format(translationKey: string, ...param: unknown[]): string {
    let translation = this.translate(translationKey);
    if (translation !== translationKey) {
      const
        matches = translation.match(/(%\d+)/g),
        params = [undefined, ...param]
      ;
      matches && matches.forEach((v: string) => {
        translation = translation.replace(v, params[+(v.substring(1)) % params.length] as string);
      });
    }
    return translation;
  }

  /**
   * Otestuje, zdali se klic prekladu nachazi ve slovniku
   */
  public hasTranslation(translationKey: string, language: string = this.language): boolean {
    const translation = this.__dictionarySg()?.[translationKey] ?? {};
    return language in translation;
  }

  /**
   * Nacte slovniky
   */
  public async load(): Promise<void> {
    return new Promise<void>((resolve: () => void) => {
      void (async () => {
        this.__waitSrv.wait = true;
        try {
          const
            response = await fetch(JSON_DICTIONARY.replace('{build}', this.__appInfo.build)),
            dictionary = response.ok ? await response.json() as Dictionary : {}
          ;

          this.__setLanguage(this.__storageSrv.getValue<string>(COMMON_I18N_SRV_LANGUAGE, this.__configSrv.defaultLanguage) as string);
          this.__dictionarySg.set(this.__dictionary = dictionary);

          resolve();
        } catch (error) {
          logException('I18nService::load', error);
        } finally {
          this.__waitSrv.wait = false;
        }
      })();
    });
  }

  /**
   * Primy preklad
   */
  public translate(key: string, language: string = this.language, defaultValue: string = key): string {
    if (!key) {
      return '';
    }
    if ('-' === key || '–' === key || '—' === key) {
      return key;
    }
    if ('-' === language || '–' === language || '—' === language) {
      return defaultValue ?? '';
    }

    if (!(key in this.__dictionary)) {
      this.__warn(`Klic „${key}“ nebyl ve slovnicich nalezen.`);
      return key === defaultValue ? this.__markUnsolved(defaultValue) : defaultValue;
    }

    const translations = this.__dictionary[key] ?? {};
    if (language in translations) {
      return translations[language] as string;
    }

    this.__warn(`Preklad klice „${key}“ v jazyce „${language}“ nebyl nalezen.`);
    return key === defaultValue ? this.__markUnsolved(defaultValue) : defaultValue;
  }

  /**
   * Nastavi jazyk aplikace
   */
  private __setLanguage(language: string = this.language): void {
    if (language !== this.__languageSg()) {
      this.__storageSrv.setValue(COMMON_I18N_SRV_LANGUAGE, language);
      this.__languageSg.set(language);
    }
    document.documentElement.lang = language;
  }

  /**
   * Oznaci neprelozeny nebo nerozpoznany preklad
   */
  private __markUnsolved(text: string): string {
    return isDevMode() ? `!@${text}#` : text;
  }

  /**
   * Vypise jednorazove varovani do konzole
   */
  private __warn(message: string): void {
    if (!this.__warnings.includes(message)) {
      this.__warnings.push(message);
      console.warn(message);
    }
  }

}
