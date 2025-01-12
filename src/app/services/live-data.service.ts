import {
  DestroyRef, Injectable, Injector, Signal, effect, inject, signal
} from '@angular/core';
import { LiveData } from '@app/models/pve.model';
import { API, API_LIVE_DATA } from '@app/models/urls.model';
import { SettingsService } from '@app/services/settings.service';

/**
 * Rozdil casu v ms
 */
const TIME_DIFF = 6e5; // 10 min.

/**
 * Sluzba pro cteni zivych dat z FVE
 */
@Injectable({
  providedIn: 'root'
})
export class LiveDataService {

  /**
   * Injektor
   */
  private __injector: Injector = inject(Injector);

  /**
   * Sluzba pro nastaveni rizeni FVE
   */
  private __settingsSrv: SettingsService = inject(SettingsService);

  /**
   * Instance signalu zivych dat
   */
  private __liveDataSg?: Signal<LiveData>;

  /**
   * Vrati signal se zivymi daty
   */
  public liveDataSg(destroyRef: DestroyRef): Signal<LiveData> {
    if (this.__liveDataSg) {
      return this.__liveDataSg;
    }

    let
      eventSource: EventSource | undefined,
      intervalHandle: number | undefined,
      lastCallTime = 0
    ;
    const
      liveDataSg = signal<LiveData>({}),
      updaterSg = signal<unknown[]>([]),
      listener = (event: MessageEvent<string>) => {
        const data = JSON.parse(event.data) as LiveData;

        liveDataSg.set(data);
        this.__settingsSrv.setRegistry(data);

        lastCallTime = Date.now();
      },
      cleanupInterval = () => {
        if (undefined !== intervalHandle) {
          window.clearInterval(intervalHandle);
          intervalHandle = undefined;
        }
      },
      cleanupSource = (renew: boolean = false) => {
        if (undefined !== eventSource) {
          eventSource.close();
          eventSource.removeEventListener('data', listener);
          eventSource = undefined;
        }
        if (renew) {
          updaterSg.set([]);
        }
      },
      checkTimeDiff = () => {
        if ((Date.now() - lastCallTime) > TIME_DIFF) {
          cleanupSource(true);
        }
      }
    ;

    effect(() => {
      updaterSg();
      if (undefined === eventSource) {
        eventSource = new EventSource(API.BuildUrl(API_LIVE_DATA));
        eventSource.addEventListener('data', listener);
      }
      if (undefined === intervalHandle) {
        intervalHandle = window.setInterval(checkTimeDiff, TIME_DIFF);
      }
    }, {injector: this.__injector});

    destroyRef.onDestroy(() => {
      cleanupInterval();
      cleanupSource();

      this.__liveDataSg = undefined;
    });

    this.__liveDataSg = liveDataSg.asReadonly();
    return this.__liveDataSg;
  }

}
