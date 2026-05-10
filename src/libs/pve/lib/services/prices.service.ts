import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import {
  API, API_MANUAL_CHARGE, API_PREDICTION, API_PRICES, WaitService, isArray,
  isNumeric, isString, logException
} from '@libs/shared';
import { PriceType, PricesType } from '../models/prices.model';

/**
 * Vychozi prednastavena data nastaveni
 */
const DEFAULT_DATA: PricesType = {
  Average: undefined,
  Data:    undefined,
  Date:    undefined,
  Error:   undefined
} as const;

/**
 * Sluzba pro nacteni cen OTE
 */
@Injectable({
  providedIn: 'root'
})
export class PricesService {

  /**
   * Sluzba pro vyckavani
   */
  private __waitSrv: WaitService = inject<WaitService>(WaitService);

  /**
   * Signal cen
   */
  private __pricesSg: WritableSignal<PricesType> = signal<PricesType>(DEFAULT_DATA);

  /**
   * Funkce pro prislib cen
   */
  private __pricesFn: (endPoint?: string) => Promise<PricesType> = (endPoint: string = API_PRICES) => {
    return new Promise<PricesType>((resolve: (value: PricesType) => void) => {
      void (async () => {
        this.__waitSrv.wait = true;
        try {
          const
            response = await fetch(API.BuildUrl(endPoint)),
            prices = response.ok ? await response.json() as Partial<PricesType> : {},
            data = this.__fixPrices(prices);
          ;

          this.__pricesSg.set(data);

          resolve(data);
        } catch (error) {
          logException('PricesService::__pricesFn', error);
        } finally {
          this.__waitSrv.wait = false;
        }
      })();
    });
  };

  /**
   * Getter signalu cen
   */
  public get pricesSg(): Signal<PricesType> {
    return this.__pricesSg;
  }

  /**
   * Konstruktor
   */
  public constructor() {
    void this.current();
  }

  /**
   * Nacte aktualni ceny OTE
   */
  public async current(): Promise<void> {
    await this.__pricesFn();
  }

  /**
   * Nacte ceny OTE na dalsi den
   */
  public async prediction(): Promise<void> {
    await this.__pricesFn(API_PREDICTION);
  }

  /**
   * Prepne nabijeci polozku
   */
  public toggleCharge(date: string, item: PriceType, endPoint: string = API_MANUAL_CHARGE): Promise<boolean> {
    return new Promise<boolean>((resolve: (value: boolean) => void) => {
      void (async () => {
        this.__waitSrv.wait = true;
        try {
          const
            options = {
              body:    JSON.stringify({date, item}),
              // eslint-disable-next-line @typescript-eslint/naming-convention
              headers: {'Content-Type': 'application/json'},
              method:  'POST'
            },
            response = await fetch(API.BuildUrl(endPoint), options),
            charge = (response.ok ? await response.json() as PriceType : {})?.Charge ?? false
          ;

          if (response.ok) {
            this.__pricesSg.update((value: PricesType) => {
              if (date === value.Date && 0 < (value.Data?.length ?? 0)) {
                for (const price of (value.Data ?? [])) {
                  (price.Time === item.Time) && (price.Charge = charge);
                }
              }
              return {...value};
            });
          }

          resolve(charge);
        } catch (error) {
          logException('PricesService::toggleCharge', error);
        } finally {
          this.__waitSrv.wait = false;
        }
      })();
    });
  }

  /**
   * Upravi data cen
   */
  private __fixPrices(by: Partial<PricesType>): PricesType {
    const result = {...DEFAULT_DATA};

    isNumeric(by.Average) && (result.Average = +by.Average);
    isArray(by.Data) && (result.Data = [...by.Data.map((value: PriceType) => ({...value}))]);
    isString(by.Date) && (result.Date = by.Date);
    isString(by.Error) && (result.Error = by.Error);

    return result;
  }

}
