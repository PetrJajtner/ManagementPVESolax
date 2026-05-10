import { Injectable, Signal, WritableSignal, effect, inject, signal } from '@angular/core';
import { COMMON_CONFIG_SRV_THEME } from '../models/keys.model';
import { API, JSON_CONFIG } from '../models/urls.model';
import { isArray, logException } from '../models/utils.model';
import { StorageService } from './storage.service';
import { WaitService } from './wait.service';

/**
 * Vychozi jazyk
 */
export const DEFAULT_LANGUAGE = 'cs';

/**
 * Tmave barevne tema
 */
export const THEME_DARK = 'theme-dark';

/**
 * Tmave barevne tema
 */
export const THEME_LIGHT = 'theme-light';

/**
 * Typ pro barevne tema
 */
export type Theme = typeof THEME_DARK | typeof THEME_LIGHT;

/**
 * Konfiguracni data
 */
export type Config = {
  AvailableLanguages: readonly string[];
  DataServerUrl:      string;
  DefaultLanguage:    string;
  Timezone:           string;
  Version:            string;
};

/**
 * Sluzba pro nacteni konfigurace aplikace
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  /**
   * Sluzba pro ukladani dat do lokalniho uloziste
   */
  private __storageSrv: StorageService = inject<StorageService>(StorageService);

  /**
   * Sluzba pro vyckavani
   */
  private __waitSrv: WaitService = inject<WaitService>(WaitService);

  /**
   * Vycet dostupnych jazyku
   */
  private __availableLanguages: readonly string[] = Object.freeze([DEFAULT_LANGUAGE]);

  /**
   * Signal konfigurace
   */
  private __configSg: WritableSignal<Config | undefined> = signal<Config | undefined>(undefined);

  /**
   * URL datoveho serveru
   */
  private __dataServerUrl: string = '/api';

  /**
   * Vychozi jazyk
   */
  private __defaultLanguage: string = DEFAULT_LANGUAGE;

  /**
   * Signal ulozeneho barevneho tematu
   */
  private __storedThemeSg: WritableSignal<Theme | undefined> = (() => {
    let defaultTheme = this.__storageSrv.getValue<Theme | undefined>(COMMON_CONFIG_SRV_THEME) as Theme | undefined;
    const storedThemeSg = signal<Theme | undefined>(defaultTheme);

    effect(() => {
      const storedTheme = storedThemeSg();
      if (storedTheme !== defaultTheme) {
        defaultTheme = storedTheme;
        if (undefined !== defaultTheme) {
          this.__storageSrv.setValue<Theme>(COMMON_CONFIG_SRV_THEME, defaultTheme);
        } else {
          this.__storageSrv.removeKey(COMMON_CONFIG_SRV_THEME);
        }
      }
    });

    return storedThemeSg;
  })();

  /**
   * Signal barevneho schematu
   */
  private __themeSg: Signal<Theme> = (() => {
    const
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)'),
      queryThemeSg = signal<Theme>(mediaQuery.matches ? THEME_DARK : THEME_LIGHT),
      themeSg = signal<Theme>(THEME_LIGHT as Theme)
    ;

    mediaQuery.addEventListener('change', (event: MediaQueryListEvent) => {
      queryThemeSg.set(event.matches ? THEME_DARK : THEME_LIGHT);
    });

    effect(() => {
      const storedTheme = this.__storedThemeSg();
      themeSg.set(undefined === storedTheme ? queryThemeSg() : storedTheme);
    });

    return themeSg.asReadonly();
  })();

  /**
   * Casova zona
   */
  private __timezone: string = 'Europe/Prague';

  /**
   * Verze konfigurace
   */
  private __version: string = '0.0.0';

  /**
   * Getter dostupnych jazyku
   */
  public get availableLanguages(): readonly string[] {
    return this.__availableLanguages;
  }

  /**
   * Getter signalu konfigurace
   */
  public get configSg(): Signal<Config | undefined> {
    return this.__configSg.asReadonly();
  }

  /**
   * Getter URL datoveho serveru
   */
  public get dataServerUrl(): string {
    return this.__dataServerUrl;
  }

  /**
   * Getter vychoziho jazyka
   */
  public get defaultLanguage(): string {
    return this.__defaultLanguage;
  }

  /**
   * Getter zapisovatelneho signalu ulozeneho barevneho tematu
   */
  public get storedThemeSg(): WritableSignal<Theme | undefined> {
    return this.__storedThemeSg;
  }

  /**
   * Getter signalu barevneho tematu
   */
  public get themeSg(): Signal<Theme> {
    return this.__themeSg;
  }

  /**
   * Getter casove zony
   */
  public get timezone(): string {
    return this.__timezone;
  }

  /**
   * Getter verze konfigurace
   */
  public get version(): string {
    return this.__version;
  }

  /**
   * Nacte konfiguraci
   */
  public async load(): Promise<void> {
    return new Promise<void>((resolve: () => void) => {
      void (async () => {
        this.__waitSrv.wait = true;
        try {
          const
            response = await fetch(JSON_CONFIG),
            data = response.ok ? await response.json() as Partial<Config> : {}
          ;

          this.__setConfiguration(data);
          this.__configSg.set(this.toJSON());

          resolve();
        } catch (error) {
          logException('ConfigService::load', error);
        } finally {
          this.__waitSrv.wait = false;
        }
      })();
    });
  }

  /**
   * Prevede data tridy na JSON
   */
  public toJSON(): Config {
    return {
      AvailableLanguages: this.availableLanguages,
      DataServerUrl:      this.dataServerUrl,
      DefaultLanguage:    this.defaultLanguage,
      Timezone:           this.timezone,
      Version:            this.version
    };
  }

  /**
   * Nastavi data konfigurace
   */
  private __setConfiguration(data: Partial<Config>): void {
    if ('AvailableLanguages' in data && isArray(data.AvailableLanguages) && data.AvailableLanguages?.length) {
      const languages = data.AvailableLanguages.map((lang: string) => `${lang}`.trim().toLowerCase());
      this.__availableLanguages = Object.freeze([...new Set(languages)]);
    }
    if ('DataServerUrl' in data && undefined !== data.DataServerUrl) {
      this.__dataServerUrl = `${data.DataServerUrl}`.trim();
    }
    if ('DefaultLanguage' in data && undefined !== data.DefaultLanguage) {
      const defaultLanguage = `${data.DefaultLanguage}`.trim().toLowerCase();
      this.__defaultLanguage = this.__availableLanguages.includes(defaultLanguage) ? defaultLanguage : DEFAULT_LANGUAGE;
    }
    if ('Timezone' in data && undefined !== data.Timezone) {
      this.__timezone = `${data.Timezone}`.trim();
    }
    if ('Version' in data && undefined !== data.Version) {
      this.__version = `${data.Version}`.trim();
    }

    if (this.__dataServerUrl) {
      API.Path = this.__dataServerUrl;
    }
  }

}
