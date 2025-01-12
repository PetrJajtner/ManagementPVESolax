import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { API, JSON_CONFIG } from '@app/models/urls.model';
import { isArray, logException } from '@app/models/utils.model';
import { WaitService } from '@app/services/wait.service';

/**
 * Konfiguracni data
 */
export type Config = {
  AvailableLanguages: string[];
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
   * Sluzba pro vyckavani
   */
  private __waitSrv: WaitService = inject(WaitService);

  /**
   * Vycet dostupnych jazyku
   */
  private __availableLanguages: Set<string> = new Set<string>(['cs']);

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
  private __defaultLanguage: string = 'cs';

  /**
   * Seznam dostupnych jazyku
   */
  private __languages: string[] = [];

  /**
   * Prislib konfigurace
   */
  private __promise: Promise<Config> = new Promise<Config>((resolve) => {
    void (async () => {
      this.__waitSrv.wait = true;

      try {
        const
          response = await fetch(JSON_CONFIG),
          data = await response.json() as Config
        ;
        if ('AvailableLanguages' in data && isArray(data.AvailableLanguages) && data.AvailableLanguages?.length) {
          this.__availableLanguages = new Set(data.AvailableLanguages.map((lang: string) => `${lang}`.trim().toLowerCase()));
        }
        if ('DataServerUrl' in data && undefined !== data.DataServerUrl) {
          this.__dataServerUrl = `${data.DataServerUrl}`.trim();
        }
        if ('DefaultLanguage' in data && undefined !== data.DefaultLanguage) {
          const defaultLanguage = `${data.DefaultLanguage}`.trim().toLowerCase();
          if (this.__availableLanguages.has(defaultLanguage)) {
            this.__defaultLanguage = defaultLanguage;
          }
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
      } catch (error) {
        logException('/app/services/ConfigService::__configSg', error);
      } finally {
        this.__waitSrv.wait = false;
      }

      const json = this.toJSON();
      this.__configSg.set(json);
      resolve(json);
    })();
  });

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
  public get availableLanguages(): string[] {
    if (this.__languages.length !== this.__availableLanguages.size) {
      this.__languages = [...this.__availableLanguages];
    }
    return this.__languages;
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
  public async load(): Promise<Config> {
    return this.__promise;
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

}
