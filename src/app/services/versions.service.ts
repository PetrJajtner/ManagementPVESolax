import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { API, API_OUTPUT, API_VERSIONS } from '@app/models/urls.model';
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
   * Funkce pro prislib vymazani logu
   */
  private __clearOutputFn: (endPoint?: string) => Promise<boolean> = (endPoint: string = API_OUTPUT) => {
    return new Promise<boolean>((resolve: (value: boolean) => void) => {
      void (async () => {
        this.__waitSrv.wait = true;

        let result = false;
        try {
          const response = await fetch(API.BuildUrl(endPoint), {method: 'DELETE'});
          result = response.ok;
        } catch (error) {
          logException('/app/services/VersionsService::__clearOutputFn', error);
        } finally {
          this.__waitSrv.wait = false;
        }

        result && this.__outputSg.set('');
        resolve(result);
      })();
    });
  };

  /**
   * Funkce pro prislib promazani logu
   */
  private __eraseOutputFn: (endPoint?: string) => Promise<string | undefined> = (endPoint: string = API_OUTPUT) => {
    return new Promise<string | undefined>((resolve: (value: string | undefined) => void) => {
      void (async () => {
        this.__waitSrv.wait = true;

        let data: string | undefined;
        try {
          const response = await fetch(API.BuildUrl(endPoint), {method: 'PATCH'});
          data = response.ok ? await response.text() as string : undefined;
        } catch (error) {
          logException('/app/services/VersionsService::__eraseOutputFn', error);
        } finally {
          this.__waitSrv.wait = false;
        }

        this.__outputSg.set(data);
        resolve(data);
      })();
    });
  };

  /**
   * Signal logu
   */
  private __outputSg: WritableSignal<string | undefined> = signal<string | undefined>(undefined);

  /**
   * Signal verzi
   */
  private __versionsSg: WritableSignal<InverterVersionsType | undefined> = signal<InverterVersionsType | undefined>(undefined);

  /**
   * Funkce pro prislib logu
   */
  private __outputFn: (endPoint?: string) => Promise<string | undefined> = (endPoint: string = API_OUTPUT) => {
    return new Promise<string | undefined>((resolve: (value: string | undefined) => void) => {
      void (async () => {
        this.__waitSrv.wait = true;
        this.__outputSg.set('…');

        let data: string | undefined;
        try {
          const response = await fetch(API.BuildUrl(endPoint));
          data = response.ok ? await response.text() as string : undefined;
        } catch (error) {
          logException('/app/services/VersionsService::__outputFn', error);
        } finally {
          this.__waitSrv.wait = false;
        }

        this.__outputSg.set(data);
        resolve(data);
      })();
    });
  };

  /**
   * Funkce pro prislib verzi
   */
  private __versionsFn: (endPoint?: string) => Promise<InverterVersionsType | undefined> = (endPoint: string = API_VERSIONS) => {
    return new Promise<InverterVersionsType | undefined>((resolve: (value: InverterVersionsType | undefined) => void) => {
      void (async () => {
        this.__waitSrv.wait = true;

        let data: InverterVersionsType | undefined;
        try {
          const response = await fetch(API.BuildUrl(endPoint));
          data = response.ok ? await response.json() as InverterVersionsType : undefined;
        } catch (error) {
          logException('/app/services/VersionsService::__versionsFn', error);
        } finally {
          this.__waitSrv.wait = false;
        }

        this.__versionsSg.set(data);
        resolve(data);
      })();
    });
  };

  /**
   * Getter signalu logu
   */
  public get outputSg(): Signal<string | undefined> {
    return this.__outputSg.asReadonly();
  }

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
    void this.loadVersions();
  }

  /**
   * Vymaze log spoustece
   */
  public async clearOutput(): Promise<void> {
    await this.__clearOutputFn();
  }

  /**
   * Promaze log spoustece
   */
  public async eraseOutput(): Promise<void> {
    await this.__eraseOutputFn();
  }

  /**
   * Nacte data logu
   */
  public async loadOutput(): Promise<void> {
    await this.__outputFn();
  }

  /**
   * Nacte data verzi stridace
   */
  public async loadVersions(): Promise<void> {
    await this.__versionsFn();
  }

}
