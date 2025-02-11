import {
  ChangeDetectionStrategy, Component, DestroyRef, Signal, WritableSignal,
  computed, inject, signal, untracked
} from '@angular/core';
import { PriceType, PricesType } from '@app/models/prices.model';
import { LiveData, MANUAL_MODES, Measurement } from '@app/models/pve.model';
import { LiveDataService } from '@app/services/live-data.service';
import { PricesService } from '@app/services/prices.service';
import { DEFAULT_SETTINGS, SettingsService } from '@app/services/settings.service';

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
type ComponentData = {
  Hour:       number;
  IsSameDate: boolean;
  Live:       ExtendedLiveData;
  Prices:     PricesType & {Multiplier: number};
};

/**
 * Rozsirena ziva data o velikost a nazev systemu
 */
type ExtendedLiveData = LiveData & {
  LoadPercent:     Measurement;
  PVESystemName:   string;
  PVESystemSize:   number;
  PVETotal:        Measurement;
  PVETotalPercent: Measurement;
  ReservedPower:   Measurement;
};

/**
 * Komponenta uvodni stranky
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host:            {class: 'index'},
  selector:        'main',
  standalone:      false,
  templateUrl:     './index.component.html'
})
export class IndexComponent {

  /**
   * Reference na destruktor
   */
  private __destroyRef: DestroyRef = inject(DestroyRef);

  /**
   * Sluzba pro cteni zivych dat z FVE
   */
  private __liveDataSrv: LiveDataService = inject(LiveDataService);

  /**
   * Sluzba pro nacteni cen OTE
   */
  private __pricesSrv: PricesService = inject(PricesService);

  /**
   * Sluzba pro nastaveni rizeni FVE
   */
  private __settingsSrv: SettingsService = inject(SettingsService);

  /**
   * Signal nasobku cen
   */
  private __priceMultiplierSg: WritableSignal<number> = signal<number>(PRICE_MULTIPLIER_MWH);

  /**
   * Signal zivych dat
   */
  private __liveDataSg: Signal<LiveData> = this.__liveDataSrv.liveDataSg(this.__destroyRef);

  /**
   * Aktualni hodina
   */
  private __currentHour: number = -1;

  /**
   * Signal s daty o FVE systemu
   */
  private __settingsDataSg = computed(() => {
    const
      {SupplyPoint, System} = this.__settingsSrv.settingsSg() ?? {SupplyPoint: DEFAULT_SETTINGS.SupplyPoint, System: DEFAULT_SETTINGS.System},
      ReservedPower = {value: SupplyPoint.CircuitBreakerValue * SupplyPoint.NormalizedVoltage * SupplyPoint.PhasesCount, unit: 'W'}
    ;
    return {PVESystemName: System.Name, PVESystemSize: System.Size, ReservedPower};
  });

  /**
   * Signal rozsirenych zivych dat
   */
  private __extendedLiveDataSg: Signal<ExtendedLiveData> = computed(() => {
    const result = {
      PVETotal:        {value: 0, unit: 'W'} as Measurement,
      PVETotalPercent: {value: 0, unit: '%'} as Measurement,
      LoadPercent:     {value: 0, unit: '%'} as Measurement,
      ...this.__settingsDataSg(),
      ...this.__liveDataSg()
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

    return result;
  });

  /**
   * Signal upravenych cen
   */
  private __pricesSg: Signal<PricesType & {Multiplier: number}> = computed<PricesType & {Multiplier: number}>(() => {
    const
      prices = this.__pricesSrv.pricesSg(),
      multiplier = this.__priceMultiplierSg(),
      result = {...prices, Data: prices.Data?.map((record: PriceType) => ({...record})), Multiplier: multiplier}
    ;
    (undefined !== result.Average) && (result.Average *= multiplier);
    (undefined !== result.Data) && (result.Data = result.Data.map((record: PriceType) => {
      (undefined !== record.Price) && (record.Price *= multiplier);
      return record;
    }));
    (undefined !== result.Threshold) && (result.Threshold *= multiplier);
    return result;
  });

  /**
   * Signal dat komponenty
   */
  private __dataSg: Signal<ComponentData> = computed(() => {
    const
      live = this.__extendedLiveDataSg(),
      prices = this.__pricesSg()
    ;

    let
      hour = this.__currentHour,
      isSameDate = true
    ;
    if (prices && prices.Date && live.Date) {
      isSameDate = live.Date.includes(prices.Date);
      hour = isSameDate ? (new Date(live.Date)).getHours() : -1;
    }
    if (prices && this.__currentHour !== hour) {
      this.__currentHour = hour;
      (-1 < hour) && this.__scrollToCurrentHour();
    }

    return {Hour: hour, IsSameDate: isSameDate, Live: live, Prices: prices};
  });

  /**
   * Getter signalu dat komponenty
   */
  public get dataSg(): Signal<ComponentData> {
    return this.__dataSg;
  }

  /**
   * Getter rezimu nuceneho nabijeni/vybijeni v manualnim rezimu
   */
  public get manualModes(): readonly string[] {
    return MANUAL_MODES;
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
   * Prepne zobrazeni cen
   */
  public switchPrice(): void {
    this.__priceMultiplierSg.set(PRICE_MULTIPLIER_MWH === untracked(this.__priceMultiplierSg) ? PRICE_MULTIPLIER_KWH : PRICE_MULTIPLIER_MWH);
    this.__scrollToCurrentHour();
  }

  /**
   * Naroluje na aktualni hodinu
   */
  private __scrollToCurrentHour(): void {
    setTimeout(() => {
      const
        wrapper = document.querySelector('.index-market-prices') as HTMLElement,
        element = document.querySelector('.current-hour') as HTMLElement
      ;
      if (!wrapper || !element) {
        return;
      }
      wrapper.scrollTo({left: element.offsetLeft - 3 * element.offsetWidth, behavior: 'smooth'});
    }, 250);
  }

}
