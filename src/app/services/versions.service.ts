import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { API, API_VERSIONS } from '@app/models/urls.model';
import { logException } from '@app/models/utils.model';
import { InverterVersionsType } from '@app/models/versions.model';
import { WaitService } from '@app/services/wait.service';

/**
 * Sluzba pro nacteni verze stridace
 */
@Injectable({
  providedIn: 'root'
})
export class VersionsService {

  /**
   * Sluzba pro vyckavani
   */
  private __waitSrv: WaitService = inject(WaitService);

  /**
   * Signal verzi
   */
  private __versionsSg: WritableSignal<InverterVersionsType | undefined> = signal<InverterVersionsType | undefined>(undefined);

  /**
   * Funkce pro prislib verzi
   */
  private __versionsFn: (endPoint?: string) => Promise<InverterVersionsType> = (endPoint: string = API_VERSIONS) => {
    return new Promise<InverterVersionsType>((resolve: (value: InverterVersionsType) => void) => {
      void (async () => {
        this.__waitSrv.wait = true;
        try {
          const
            response = await fetch(API.BuildUrl(endPoint)),
            data = await response.json() as InverterVersionsType
          ;
          this.__versionsSg.set(data);
          resolve(data);
        } catch (error) {
          logException('/app/services/VersionsService::__versionsFn', error);
        } finally {
          this.__waitSrv.wait = false;
        }
      })();
    });
  };

  /**
   * Getter signalu verzi stridace
   */
  public get versionsSg(): Signal<InverterVersionsType | undefined> {
    return this.__versionsSg.asReadonly();
  }

  /**
   * Konstruktor
   */
  public constructor() {
    void this.load();
  }

  /**
   * Nacte data verzi stridace
   */
  public async load(): Promise<void> {
    await this.__versionsFn();
  }

}
