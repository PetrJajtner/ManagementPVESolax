import {
  Injectable, Signal, WritableSignal, computed, inject, isDevMode, signal
} from '@angular/core';
import { COMMON_I18N_SRV_LANGUAGE } from '@app/models/keys.model';
import { JSON_DICTIONARY } from '@app/models/urls.model';
import { logException } from '@app/models/utils.model';
import { WaitService } from '@app/services//wait.service';
import { ConfigService } from '@app/services/config.service';
import { StorageService } from '@app/services/storage.service';

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
   * Sluzba pro nacteni konfigurace aplikace
   */
  private __configSrv: ConfigService = inject(ConfigService);

  /**
   * Sluzba pro ukladani dat do lokalniho uloziste
   */
  private __storageSrv: StorageService = inject(StorageService);

  /**
   * Sluzba pro vyckavani
   */
  private __waitSrv: WaitService = inject(WaitService);

  /**
   * Slovnik
   */
  private __dictionary: Dictionary = {};

  /**
   * Signal nactenych slovniku
   */
  private __dictionarySg: WritableSignal<Dictionary> = signal(this.__dictionary);

  /**
   * Prislib dat slovniku
   */
  private __promise: Promise<Dictionary> = new Promise<Dictionary>((resolve) => {
    void (async () => {
      this.__waitSrv.wait = true;
      try {
        const
          response = await fetch(JSON_DICTIONARY),
          dictionary = response.ok ? await response.json() as Dictionary : {}
        ;

        this.__setLanguage(this.__storageSrv.getValue<string>(COMMON_I18N_SRV_LANGUAGE, this.__configSrv.defaultLanguage) as string);
        this.__dictionarySg.set(this.__dictionary = dictionary);

        resolve(this.__dictionary);
      } catch (error) {
        logException('/app/services/I18nService::__promise', error);
      } finally {
        this.__waitSrv.wait = false;
      }
    })();
  });

  /**
   * Signal aktualniho jazyka aplikace
   */
  private __languageSg: WritableSignal<string> = signal<string>(this.__configSrv.defaultLanguage);

  /**
   * Signal dostupnych jazyku
   */
  private __languagesSg: Signal<string[]> = computed(() => {
    return this.__configSrv.configSg()?.AvailableLanguages ?? [this.__configSrv.defaultLanguage];
  });

  /**
   * Preklady
   */
  private __translationsSg: Signal<Translation> = computed(() => {
    const
      dictionary = this.__dictionarySg(),
      language = this.__languageSg()
    ;
    if (dictionary && language) {
      return Object.entries(dictionary).reduce((acc: Translation, [key, value]: [string, Translation]) => {
        return language in value ? {...acc, [key]: value[language]} : acc;
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
  public set language(newValue: string) {
    this.__setLanguage(newValue);
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
  public get languagesSg(): Signal<string[]> {
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
  public async load(): Promise<Dictionary> {
    return this.__promise;
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

    const translations = this.__dictionary[key];
    if (language in translations) {
      return translations[language];
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
