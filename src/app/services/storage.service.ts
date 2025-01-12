import { Injectable } from '@angular/core';
import { APPLICATION_BUILD, APPLICATION_NAME } from '@app/app.settings';
import { BrowserStorage, LOCAL_STORAGE } from '@app/models/browser-storage.model';

/**
 * Sluzba pro ukladani dat do lokalniho uloziste
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService extends BrowserStorage {

  /**
   * Konstruktor sluzby
   */
  public constructor() {
    super(`${APPLICATION_NAME}[${APPLICATION_BUILD}]`, LOCAL_STORAGE);
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
      return key.startsWith(APPLICATION_NAME) && !key.startsWith(namespace); // aktualni nebo cizi klice vynechame
    }).forEach((key: string) => {
      storage.removeItem(key);
    });
  }

}
