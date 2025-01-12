/**
 * Seznam URL konfiguraci a API volani
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2020 - nyni
 */
import { isObject, isString } from '@app/models/utils.model';

// --- Staticke konfigurace ----------------------------------------------------

/**
 * URL konfigurace aplikace
 */
export const JSON_CONFIG = 'assets/config.json';

/**
 * URL slovniku
 */
export const JSON_DICTIONARY = 'assets/dictionary.json';

/**
 * URL konfigurace lokalizaci
 */
export const JSON_LOCALES_CONFIG = 'assets/locales.config.json';

// --- Konfigurace API volani --------------------------------------------------

/**
 * Cesta k API serveru
 */
export const SERVER_PATH = '';

/**
 * URL prefix pro data
 */
export const PREFIX_DATA = '';

/**
 * URL zivych dat
 */
export const API_LIVE_DATA = 'live-data';

/**
 * URL cen OTE na dalsi den
 */
export const API_PREDICTION = 'prediction';

/**
 * URL cen OTE
 */
export const API_PRICES = 'prices';

/**
 * URL dat registru
 */
export const API_REGISTRY = 'registry';

/**
 * URL konfigurace nastaveni
 */
export const API_SETTINGS = 'settings';

/**
 * URL konfigurace verzi stridace
 */
export const API_VERSIONS = 'versions';

// --- API volani --------------------------------------------------------------

/**
 * Rozhrani pro sestavovani URL
 */
export type BuildUrlOptions = {
  url:     string;
  params?: string | string[];
  prefix?: boolean;
};

/**
 * Staticka trida pro sestaveni URL
 */
export class API {

  /**
   * Serverova cesta k API
   */
  private static __path: string = SERVER_PATH;

  /**
   * Prefix urcujici vystupni format
   */
  private static __prefix: string = PREFIX_DATA;

  /**
   * Getter serverove cesta k API
   */
  public static get Path(): string {
    return API.__path;
  }

  /**
   * Setter serverove cesta k API
   */
  public static set Path(value: string) {
    API.__path = ('' + (value || '')).replace(/\/+|\/+$/, '');
  }

  /**
   * Getter prefixu
   */
  public static get Prefix(): string {
    return API.__prefix;
  }

  /**
   * Setter prefixu
   */
  public static set Prefix(value: string) {
    API.__prefix = ('' + (value || '')).replace(/\/+|\/+$/, '');
  }

  /**
   * Sestavi URL dle parametru
   */
  public static BuildUrl(url: string, ...parts: string[]): string;
  public static BuildUrl(options: BuildUrlOptions, ...parts: string[]): string;
  public static BuildUrl(optionsOrUrl: BuildUrlOptions | string, ...parts: string[]): string {
    let url = '', prefix = false, params: string | string[] = [];
    if (isString(optionsOrUrl)) {
      url = optionsOrUrl;
      prefix = true;
      params = parts;
    }
    if (isObject(optionsOrUrl)) {
      ({url, prefix = true, params = []} = optionsOrUrl);
    }
    if (isString(params)) {
      params = [params];
    }
    return [API.__path, prefix ? API.__prefix : '', url, ...params].map((part: string) => {
      return `${part || ''}`.replace(/\/+|\/+$/, '').trim();
    }).filter((part: string) => {
      return !!part;
    }).join('/');
  }

}
