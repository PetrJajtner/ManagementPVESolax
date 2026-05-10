import {
  ChangeDetectionStrategy, Component, Signal, WritableSignal, effect, inject,
  signal
} from '@angular/core';
import { InverterVersionsType } from '@libs/pve';
import {
  API, API_OUTPUT, API_VERSIONS, APP_INFO, AppInfo, DateFmtPipe, TranslatePipe,
  WaitService, logException
} from '@libs/shared';

/**
 * Komponenta napovedy
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host:            {class: 'help'},
  imports:         [
    DateFmtPipe,
    TranslatePipe
  ],
  selector:        'main',
  templateUrl:     './index.component.html'
})
export class IndexComponent {

  /**
   * Data informaci o aplikaci
   */
  private __appInfo: AppInfo = inject<AppInfo>(APP_INFO);

  /**
   * Sluzba pro vyckavani
   */
  private __waitSrv: WaitService = inject<WaitService>(WaitService);

  /**
   * Signal logu
   */
  private __outputSg: WritableSignal<string | undefined> = (() => {
    const outputSg = signal<string | undefined>(undefined);

    effect(() => {
      outputSg() && setTimeout(() => {
        const element = document.querySelector<HTMLElement>('.plain-text');
        element?.scrollTo({behavior: 'smooth', top: element.scrollHeight});
      }, 250);
    });

    return outputSg;
  })();

  /**
   * Signal verzi
   */
  private __versionsSg: Signal<InverterVersionsType | undefined> = (() => {
    const versionsSg = signal<InverterVersionsType | undefined>(undefined);

    void (async () => {
      this.__waitSrv.wait = true;

      try {
        const
          response = await fetch(API.BuildUrl(API_VERSIONS)),
          data = response.ok ? await response.json() as InverterVersionsType : undefined
        ;
        versionsSg.set(data);
      } catch (error) {
        logException('IndexComponent::__versionsSg', error);
      } finally {
        this.__waitSrv.wait = false;
      }
    })();

    return versionsSg.asReadonly();
  })();

  /**
   * Getter sestaveni aplikace
   */
  public get build(): string {
    return this.__appInfo.build;
  }

  /**
   * Getter data sestaveni aplikace
   */
  public get date(): string {
    return this.__appInfo.date;
  }

  /**
   * Getter signalu logu
   */
  public get outputSg(): Signal<string | undefined> {
    return this.__outputSg.asReadonly();
  }

  /**
   * Getter verze aplikace
   */
  public get version(): string {
    return this.__appInfo.version;
  }

  /**
   * Getter signalu verzi stridace
   */
  public get versionsSg(): Signal<InverterVersionsType | undefined> {
    return this.__versionsSg;
  }

  /**
   * Vymaze log spoustece
   */
  public clearOutput(): void {
    void (async () => {
      this.__waitSrv.wait = true;

      try {
        const response = await fetch(API.BuildUrl(API_OUTPUT), {method: 'DELETE'});
        response.ok && this.__outputSg.set('');
      } catch (error) {
        logException('IndexComponent::clearOutput', error);
      } finally {
        this.__waitSrv.wait = false;
      }
    })();
  }

  /**
   * Promaze log spoustece
   */
  public eraseOutput(): void {
    void (async () => {
      this.__waitSrv.wait = true;

      try {
        const
          response = await fetch(API.BuildUrl(API_OUTPUT), {method: 'PATCH'}),
          data = response.ok ? await response.text() as string : undefined;
        ;
        this.__outputSg.set(data);
      } catch (error) {
        logException('IndexComponent::eraseOutput', error);
      } finally {
        this.__waitSrv.wait = false;
      }
    })();
  }

  /**
   * Nacte data logu
   */
  public loadOutput(): void {
    void (async () => {
      this.__waitSrv.wait = true;

      this.__outputSg.set('…');
      try {
        const
          response = await fetch(API.BuildUrl(API_OUTPUT)),
          data = response.ok ? await response.text() as string : undefined
        ;
        this.__outputSg.set(data);
      } catch (error) {
        logException('IndexComponent::loadOutput', error);
      } finally {
        this.__waitSrv.wait = false;
      }
    })();
  }

}
