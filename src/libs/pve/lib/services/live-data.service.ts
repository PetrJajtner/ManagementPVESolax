import {
  DestroyRef, Injectable, Injector, Signal, WritableSignal, effect, inject,
  signal
} from '@angular/core';
import { API, API_LIVE_DATA } from '@libs/shared';
import { ChargingData, LiveData } from '../models/pve.model';

/**
 * Udalost SSE - data nabijeni
 */
export const SSE_EVENT_CHARGE = 'charge';

/**
 * Udalost SSE - data senzoru
 */
export const SSE_EVENT_DATA = 'data';

/**
 * Rozdil casu v ms
 */
const TIME_DIFF = 6e5; // 10 min.

/**
 * Typy prijimanych zprav
 */
export type SSEEventType =
  typeof SSE_EVENT_CHARGE |
  typeof SSE_EVENT_DATA
;

/**
 * Typ zivych dat
 */
export type LiveDataType = {
  [SSE_EVENT_CHARGE]: Signal<ChargingData>;
  [SSE_EVENT_DATA]:   Signal<LiveData>;
};

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
  private __injector: Injector = inject<Injector>(Injector);

  /**
   * Signaly datovych zdroju
   */
  private __signals?: LiveDataType;

  /**
   * Signal pro obnovu spojeni
   */
  private __refreshSg: WritableSignal<unknown[]> = signal<unknown[]>([]);

  /**
   * Vrati signaly se zivymi daty
   */
  public getSignals(destroyRef?: DestroyRef): LiveDataType {
    if (this.__signals) {
      return this.__signals;
    }

    let
      eventSource: EventSource | undefined,
      intervalHandle: number | undefined,
      lastCallTime = 0
    ;
    const
      chargingSg = signal<ChargingData>([]),
      liveDataSg = signal<LiveData>({}),
      updaterSg = signal<unknown[]>([]),
      chargingListener = (event: MessageEvent<string>) => {
        chargingSg.set([...(JSON.parse(event.data) as unknown[])] as ChargingData);
        lastCallTime = Date.now();
      },
      liveDataListener = (event: MessageEvent<string>) => {
        liveDataSg.set({...JSON.parse(event.data), Id: event.lastEventId} as LiveData);
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
          eventSource.removeEventListener(SSE_EVENT_CHARGE, chargingListener);
          eventSource.removeEventListener(SSE_EVENT_DATA, liveDataListener);
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
        eventSource.addEventListener(SSE_EVENT_CHARGE, chargingListener);
        eventSource.addEventListener(SSE_EVENT_DATA, liveDataListener);
      }
      if (undefined === intervalHandle) {
        intervalHandle = window.setInterval(checkTimeDiff, TIME_DIFF);
      }
    }, {injector: this.__injector});

    effect(() => {
      this.__refreshSg();
      if (undefined === eventSource || EventSource.CLOSED === eventSource.readyState) {
        cleanupSource(true);
      }
    }, {injector: this.__injector});

    destroyRef?.onDestroy(() => {
      cleanupInterval();
      cleanupSource();

      this.__signals = undefined;
    });

    return this.__signals = {
      [SSE_EVENT_CHARGE]: chargingSg.asReadonly(),
      [SSE_EVENT_DATA]:   liveDataSg.asReadonly()
    };
  }

  /**
   * Provede pokus o znovupripojeni
   */
  public refresh(): void {
    this.__refreshSg.set([]);
  }

}
