import { Injectable, inject } from '@angular/core';
import { APP_INFO, AppInfo } from '../models/app-info.model';
import { BrowserStorage, LOCAL_STORAGE } from '../models/browser-storage.model';

/**
 * Sluzba pro ukladani dat do lokalniho uloziste
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService extends BrowserStorage {

  /**
   * Nazev aplikace
   */
  private __appName: string = '';

  /**
   * Konstruktor sluzby
   */
  public constructor() {
    const {name, build} = inject<AppInfo>(APP_INFO);

    super(`${name}[${build}]`, LOCAL_STORAGE);
    this.__appName = name;

    void this.__removeOldKeys();
  }

  /**
   * Odstrani stare klice aplikace
   */
  private async __removeOldKeys(): Promise<void> {
    if (!this.isSupported) {
      return;
    }

    const
      storage = this._getStorage(),
      namespace = this.getNamespace()
    ;

    Object.keys(storage).filter((key: string) => {
      return key.startsWith(this.__appName) && !key.startsWith(namespace); // aktualni nebo cizi klice vynechame
    }).forEach((key: string) => {
      storage.removeItem(key);
    });
  }

}
