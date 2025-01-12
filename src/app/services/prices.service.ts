import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import { PriceType, PricesType } from '@app/models/prices.model';
import { API, API_PREDICTION, API_PRICES } from '@app/models/urls.model';
import { isArray, isNumeric, isString, logException } from '@app/models/utils.model';
import { WaitService } from '@app/services/wait.service';

/**
 * Vychozi prednastavena data nastaveni
 */
const DEFAULT_DATA: PricesType = {
  Average:   undefined,
  Data:      undefined,
  Date:      undefined,
  Error:     undefined,
  Threshold: undefined
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
  private __waitSrv: WaitService = inject(WaitService);

  /**
   * Signal cen
   */
  private __pricesSg: WritableSignal<PricesType> = signal<PricesType>(DEFAULT_DATA);

  /**
   * Funkce pro prislib cen
   */
  private __pricesFn: (endPoint?: string) => Promise<PricesType> = (endPoint: string = API_PRICES) => {
    return new Promise<PricesType>((resolve) => {
      void (async () => {
        this.__waitSrv.wait = true;
        try {
          const
            response = await fetch(API.BuildUrl(endPoint)),
            prices = await response.json() as Partial<PricesType>,
            data = this.__fixPrices(prices);
          ;
          this.__pricesSg.set(data);
          resolve(data);
        } catch (error) {
          logException('/app/services/PricesService::__pricesFn', error);
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
   * Upravi data cen
   */
  private __fixPrices(by: Partial<PricesType>): PricesType {
    const result = {...DEFAULT_DATA};

    isNumeric(by.Average) && (result.Average = +by.Average);
    isArray(by.Data) && (result.Data = [...by.Data.map((value: PriceType) => ({...value}))]);
    isString(by.Date) && (result.Date = by.Date);
    isString(by.Error) && (result.Error = by.Error);
    isNumeric(by.Threshold) && (result.Threshold = +by.Threshold);

    return result;
  }

}
