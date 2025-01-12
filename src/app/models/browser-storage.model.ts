/**
 * Model pro ukladani do uloziste prohlizece
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2018 - nyni
 */
import { APPLICATION_NAME } from '@app/app.settings';

/**
 * Typ pro lokalni uloziste
 */
export const LOCAL_STORAGE = 'localStorage';

/**
 * Typ pro relacni uloziste
 */
export const SESSION_STORAGE = 'sessionStorage';

/**
 * Dostupna uloziste prohlizece
 */
const STORAGES: readonly string[] = Object.freeze([
  LOCAL_STORAGE,
  SESSION_STORAGE
]);

/**
 * Typ pro uloziste
 */
export type StorageType =
  typeof LOCAL_STORAGE |
  typeof SESSION_STORAGE
;

/**
 * Trida uloziste prohlizece
 */
export class BrowserStorage {

  /**
   * Jmenny prostor v ulozisti
   */
  private __namespace: string = '';

  /**
   * Typ uloziste
   */
  private __type: StorageType = LOCAL_STORAGE;

  /**
   * Vyprazdni obe uloziste (localStorage i sessionStorage)
   */
  public static ForceClear(): void {
    if (LOCAL_STORAGE in window) {
      localStorage.clear();
    }
    if (SESSION_STORAGE in window) {
      sessionStorage.clear();
    }
  }

  /**
   * Getter priznaku podpory uloziste dle zvoleneho typu uloziste
   */
  public get isSupported(): boolean {
    try {
      return !!(window as any)?.[this.__type];
    } catch (error: unknown) {
      error;
      return false;
    }
  }

  /**
   * Konstruktor uloziste
   */
  public constructor(namespace: string = APPLICATION_NAME, type?: StorageType) {
    this.setNamespace(namespace);
    type && this.setStorage(type);
  }

  /**
   * Vyprazdni/vymaze uloziste dle parametru
   *   Pokud neni uveden nebo nabyva hodnoty false, vymazou se klice
   *   s prefixem; TRUE - vyprazdni storage; string - vymaze klice
   *   obsahujici retezec bez ohledu na jmenny prostor
   */
  public clearAll(what?: boolean | string): this {
    if (!arguments.length || !what) {
      what = '' + this.getNamespace(true) + '\\.';
    }
    if (this.isSupported) {
      const
        storage: Storage = this._getStorage(),
        type: string = typeof what
      ;
      if ('string' === type) {
        const regexp = new RegExp(what as string, 'g');

        let size: number = storage.length;
        while (size--) {
          const key = storage.key(size);
          if (key && key.match(regexp)) {
            delete storage[key];
          }
        }
      }
      if ('boolean' === type && what) {
        storage.clear();
      }
    }
    return this;
  }

  /**
   * Vymaze stare jmenne prostory
   */
  public clearOld(): this {
    if (this.isSupported) {
      const
        regexp = new RegExp('' + this.getNamespace(true) + '\\.', 'g'),
        storage = this._getStorage()
      ;

      let size: number = storage.length;
      while (size--) {
        const key = storage.key(size);
        if (key && !key.match(regexp)) {
          delete storage[key];
        }
      }
    }
    return this;
  }

  /**
   * Vrati zvoleny jmenny prostor uloziste
   */
  public getNamespace(asRegex: boolean = false): string {
    const namespace: string = this.__namespace;
    if (asRegex) {
      return namespace.replace('.', '\\.').replace('(', '\\(').replace(')', '\\)').replace('[', '\\[').replace(']', '\\]');
    }
    return namespace;
  }

  /**
   * Vrati hodnotu nastaveni dle klice. Pokud neni klic nalezen, vrati se defaultValue
   */
  public getValue<T>(key: string, defaultValue?: T): T | undefined {
    if (!this.isSupported) {
      return defaultValue as T;
    }

    const
      nsKey = this.__getNSKey(key),
      storage = this._getStorage(),
      value = (storage[nsKey] || null) as string | null
    ;
    if (null !== value) {
      try {
        return (JSON.parse(value) ?? defaultValue) as T | undefined;
      } catch (error: unknown) {
        console.error(error);
      }
    }

    return defaultValue;
  }

  /**
   * Vrati vsechna nastaveni jako pary klic => hodnota
   */
  public getValues<T extends object, U extends keyof T>(rawKeys: boolean = false): T {
    const
      values = {} as T,
      regexp = new RegExp('' + this.getNamespace(true) + '\\.', 'g'),
      storage = this._getStorage()
    ;

    for (let i = 0, l: number = storage.length; i < l; ++i) {
      const key = storage.key(i);
      if (key && key.match(regexp)) {
        values[(rawKeys ? key : key.replace(regexp, '')) as U] = JSON.parse(storage[key] as string) as T[U];
      }
    }

    return values;
  }

  /**
   * Otestuje, zdali je klic obsazen v ulozisti
   */
  public hasKey(key: string): boolean {
    if (!this.isSupported) {
      return false;
    }

    const
      nsKey: string = this.__getNSKey(key),
      storage: Storage = this._getStorage()
    ;
    return nsKey in storage;
  }

  /**
   * Odebere klic z uloziste
   */
  public removeKey(key: string): boolean {
    if (!this.isSupported) {
      return false;
    }

    const
      nsKey: string = this.__getNSKey(key),
      storage: Storage = this._getStorage()
    ;
    delete storage[nsKey];

    return true;
  }

  /**
   * Nastavi vychozi jmenny prostor uloziste
   */
  public setNamespace(namespace: string): this {
    if (!namespace) {
      throw new Error('Neni specifikovan jmenny prostor uloziste!');
    }
    this.__namespace = ('' + namespace).replace(/\.+$/g, '');
    return this;
  }

  /**
   * Nastavi vychozi typ uloziste
   */
  public setStorage(type: StorageType): this {
    if (!STORAGES.includes(type)) {
      throw new Error('Neni specifikovan korektni typ uloziste!');
    }

    this.__type = type;
    return this;
  }

  /**
   * Nastavi klic key na hodnotu value
   */
  public setValue<T>(key: string, value: T): this {
    if (this.isSupported) {
      const
        nsKey = this.__getNSKey(key),
        storage = this._getStorage()
      ;
      storage[nsKey] = JSON.stringify(value ?? null);
    }
    return this;
  }

  /**
   * Nastavi vsechny vlastnosti z objektu data
   */
  public setValues<T extends object>(data: T): this {
    for (const [key, value] of Object.entries(data)) {
      this.setValue(key, value);
    }
    return this;
  }

  /**
   * Vrati dany typ uloziste
   */
  protected _getStorage(): Storage {
    return (window as any)[this.__type] as Storage;
  }

  /**
   * Vrati klic s namespacem
   */
  private __getNSKey(key: string): string {
    return this.getNamespace() + '.' + key;
  }

}
