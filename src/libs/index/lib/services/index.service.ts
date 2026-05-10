import {
  Injectable, Signal, WritableSignal, computed, inject, signal, untracked
} from '@angular/core';
import {
  ChargingData, ChargingType, LiveData, LiveDataService, Measurement,
  PriceType, PricesService, PricesType, SSE_EVENT_CHARGE, SSE_EVENT_DATA
} from '@libs/pve';
import { DEFAULT_SETTINGS, SettingsService } from '@libs/settings';

/**
 * Nasobek ceny za kWh
 */
const PRICE_MULTIPLIER_KWH = 0.001;

/**
 * Nasobek ceny za MWh
 */
const PRICE_MULTIPLIER_MWH = 1;

/**
 * Data komponenty
 */
export type ComponentData = {
  IsSameDate:   boolean;
  Live:         ExtendedLiveData;
  ManualCharge: boolean;
  Prices:       PricesType & {Multiplier: number};
  Threshold?:   number;
  Time:         string;
};

/**
 * Rozsirena ziva data o velikost a nazev systemu
 */
export type ExtendedLiveData = LiveData & PVESystem & {
  LoadPercent:     Measurement;
  PVETotal:        Measurement;
  PVETotalPercent: Measurement;
  RunningDays:     number;
  RunningYears:    number;
};

/**
 * Data o FV systemu
 */
export type PVESystem = {
  PVESystemDate: string;
  PVESystemName: string;
  PVESystemSize: number;
  ReservedPower: Measurement;
};

/**
 * Sluzba pro prehledovou stranku
 */
@Injectable({
  providedIn: 'root'
})
export class IndexService {

  /**
   * Sluzba pro cteni zivych dat z FVE
   */
  private __liveDataSrv: LiveDataService = inject<LiveDataService>(LiveDataService);

  /**
   * Sluzba pro nacteni cen OTE
   */
  private __pricesSrv: PricesService = inject<PricesService>(PricesService);

  /**
   * Sluzba pro nastaveni rizeni FVE
   */
  private __settingsSrv: SettingsService = inject<SettingsService>(SettingsService);

  /**
   * Signal dat "chytreho" nabijeni
   */
  private __chargingSg: Signal<ChargingData> = this.__liveDataSrv.getSignals()[SSE_EVENT_CHARGE];

  /**
   * Aktualni ctvrthodina
   */
  private __currentTime: string = '';

  /**
   * Signal dat komponenty
   */
  private __dataSg: Signal<ComponentData> = computed(() => {
    const
      live = this.__extendedLiveDataSg(),
      manualCharge = this.__manualChargeSg(),
      prices = this.__pricesSg(),
      settings = this.__settingsSrv.settingsSg(),
      threshold = settings?.Threshold,
      meteringInterval = settings?.MeteringInterval
    ;

    let
      time = this.__currentTime,
      isSameDate = true
    ;
    if (prices && prices.Date && live.Date) {
      isSameDate = live.Date.includes(prices.Date);
      time = isSameDate ? live.Date.slice(11, 13) + ':' + (meteringInterval ? `${15 * Math.floor(+live.Date.slice(14, 16) / 15)}`.padStart(2, '0') : '00') : '';
    }
    if (prices && this.__currentTime !== time) {
      this.__currentTime = time;
      ('' !== time) && this.scrollToCurrentQuarter();
    }

    return {
      IsSameDate:   isSameDate,
      Live:         live,
      ManualCharge: manualCharge,
      Prices:       prices,
      Threshold:    threshold,
      Time:         time
    };
  });

  /**
   * Signal rozsirenych zivych dat
   */
  private __extendedLiveDataSg: Signal<ExtendedLiveData> = computed(() => {
    const result = {
      PVETotal:        {value: 0, unit: 'W'} as Measurement,
      PVETotalPercent: {value: 0, unit: '%'} as Measurement,
      LoadPercent:     {value: 0, unit: '%'} as Measurement,
      ...this.__pveSystemSg(),
      ...this.__liveDataSg(),
      RunningDays:     0,
      RunningYears:    0
    } as ExtendedLiveData;

    if (result.PV1Power && result.PV2Power) {
      result.PVETotal.value = result.PV1Power.value + result.PV2Power.value;
      result.PVETotal.unit = result.PV1Power.unit ?? result.PV2Power.unit;
    }
    if (0 < result.PVESystemSize && result.PVETotal) {
      result.PVETotalPercent.value = +(result.PVETotal.value / result.PVESystemSize * 100).toFixed(1);
    }
    if (result.LoadPower && result.ReservedPower) {
      result.LoadPercent.value = +(result.LoadPower.value / result.ReservedPower.value * 100).toFixed(1);
      if (0 > result.LoadPercent.value) {
        result.LoadPercent.value = 0;
      }
    }
    if (result.EPS1Power && result.EPS1Voltage && result.EPS1Current &&
        (result.EPS1Power?.value ?? 0) < ((result.EPS1Voltage?.value ?? 0) * (result.EPS1Current?.value ?? 0))) {
      result.EPS1Power.value = result.EPS1Voltage.value * result.EPS1Current.value;
    }
    if (result.EPS2Power && result.EPS2Voltage && result.EPS2Current &&
        (result.EPS2Power?.value ?? 0) < ((result.EPS2Voltage?.value ?? 0) * (result.EPS2Current?.value ?? 0))) {
      result.EPS2Power.value = result.EPS2Voltage.value * result.EPS2Current.value;
    }
    if (result.EPS3Power && result.EPS3Voltage && result.EPS3Current &&
        (result.EPS3Power?.value ?? 0) < ((result.EPS3Voltage?.value ?? 0) * (result.EPS3Current?.value ?? 0))) {
      result.EPS3Power.value = result.EPS3Voltage.value * result.EPS3Current.value;
    }
    if (result.ACPowerTotal && result.LoadPower && result.EPS1Power && result.EPS2Power && result.EPS3Power &&
        (0.0 < ((result.EPS1Power?.value ?? 0) + (result.EPS2Power?.value ?? 0) + (result.EPS3Power?.value ?? 0)))) {
      const sum = +(result.EPS1Power.value + result.EPS2Power.value + result.EPS3Power.value).toFixed(0);
      result.ACPowerTotal.value = sum;
      result.LoadPower.value = sum;
    }
    if (null !== result.PVESystemDate.match(/\d{4}-\d{2}-\d{2}/)) {
      const difference = Date.now() - (new Date(result.PVESystemDate as string)).valueOf();
      result.RunningDays = difference / 86400000;
      result.RunningYears = result.RunningDays / 365.25;
    }

    return result;
  });

  /**
   * Signal zivych dat
   */
  private __liveDataSg: Signal<LiveData> = this.__liveDataSrv.getSignals()[SSE_EVENT_DATA];

  /**
   * Signal priznaku manualniho rizeni nabijeni dle spotovych cen
   */
  private __manualChargeSg: Signal<boolean> = computed<boolean>(() => {
    return this.__settingsSrv.settingsSg()?.SmartCharge.ManualControl ?? false;
  });

  /**
   * Signal upravenych cen
   */
  private __pricesSg: Signal<PricesType & {Multiplier: number}> = computed<PricesType & {Multiplier: number}>(() => {
    const
      charging = this.__chargingSg(),
      multiplier = this.__priceMultiplierSg(),
      prices = this.__pricesSrv.pricesSg()
    ;
    return {
      ...prices,
      Data: prices.Data?.map((price: PriceType) => {
        return {...price, SmartCharge: charging.some((charge: ChargingType) => (price.Time === charge.Time && prices.Date === charge.Date))};
      }),
      Multiplier: multiplier
    };
  });

  /**
   * Signal nasobku cen
   */
  private __priceMultiplierSg: WritableSignal<number> = signal<number>(PRICE_MULTIPLIER_MWH);

  /**
   * Signal s daty o FV systemu
   */
  private __pveSystemSg: Signal<PVESystem> = computed<PVESystem>(() => {
    const
      {SupplyPoint, System} = this.__settingsSrv.settingsSg() ?? {SupplyPoint: DEFAULT_SETTINGS.SupplyPoint, System: DEFAULT_SETTINGS.System},
      ReservedPower = {value: SupplyPoint.CircuitBreakerValue * SupplyPoint.NormalizedVoltage * SupplyPoint.PhasesCount, unit: 'W'}
    ;
    return {PVESystemDate: System.Date, PVESystemName: System.Name, PVESystemSize: System.Size, ReservedPower};
  });

  /**
   * Getter signalu dat pro komponentu prehledu
   */
  public get dataSg(): Signal<ComponentData> {
    return this.__dataSg;
  }

  /**
   * Zobrazi ceny OTE na dalsi den
   */
  public displayPrediction(): void {
    void this.__pricesSrv.prediction();
  }

  /**
   * Zobrazi ceny OTE aktualniho dne
   */
  public displayPrices(): void {
    void this.__pricesSrv.current();
  }

  /**
   * Obnovi ziva data
   */
  public refresh(): void {
    this.__liveDataSrv.refresh();
  }

  /**
   * Naroluje na aktualni ctvrthodinu
   */
  public scrollToCurrentQuarter(): void {
    setTimeout(() => {
      const
        wrapper = document.querySelector<HTMLElement>('.index-market-prices'),
        element = document.querySelector<HTMLElement>('.current-time')
      ;
      wrapper && element && wrapper.scrollTo({behavior: 'smooth', left: element.offsetLeft - 3 * element.offsetWidth});
    }, 250);
  }

  /**
   * Prepne zobrazeni cen
   */
  public switchPrice(): void {
    this.__priceMultiplierSg.set(PRICE_MULTIPLIER_MWH === untracked(this.__priceMultiplierSg) ? PRICE_MULTIPLIER_KWH : PRICE_MULTIPLIER_MWH);
    this.scrollToCurrentQuarter();
  }

  /**
   * Prepne nabijeci polozku
   */
  public toogleCharge(date: string, item: PriceType): void {
    void this.__pricesSrv.toggleCharge(date, item);
  }

}
