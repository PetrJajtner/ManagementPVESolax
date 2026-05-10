/**
 * Seznam cest k modulum aplikace
 *
 * @author     Ing. Petr Jajtner <petr@jajtnerovi.cz>
 * @copyright  Ing. Petr Jajtner 2024
 */
import {
  KEY_BIAS_MODE, KEY_BIAS_POWER, KEY_DATE_TIME, KEY_EXPORT_CONTROL,
  KEY_MANUAL_MODE_CHARGING, KEY_SELF_USE_MIN_SOC, KEY_WORKING_MODE
} from '@libs/pve';

/**
 * Mapa chybovych hlasek
 */
export const ERROR_MAP: Readonly<Record<string, string | string[]>> = Object.freeze({
  minlength:  ['ErrorMinLengthN', 'requiredLength', 'actualLength'],
  pattern:    ['ErrorPatternNotMatchN', 'actualValue', 'requiredPattern'],
  required:  'ErrorRequired'
});

/**
 * Typy prubehovych mereni
 */
export const METERING_INVERVALS: readonly string[] = Object.freeze([
  /* 0 => */ 'MeteringIntervalHour',
  /* 1 => */ 'MeteringIntervalQuarter'
]);

/**
 * Uroven logovani - zmena
 */
export const LOG_CHANGE = 1 << 0;

/**
 * Uroven logovani - informace
 */
export const LOG_MESSAGE = 1 << 1;

/**
 * Urovne "ukecanosti" spoustece
 */
export const VERBOSE_LEVELS: Readonly<Record<string, number>> = Object.freeze({
  SettingsVerboseLevelChange:  LOG_CHANGE,
  SettingsVerboseLevelMessage: LOG_MESSAGE
});

/**
 * Typ pro rizeni exportu
 */
export type ExportType = {

  /**
   * Rezim ovlivneni pretoku (vypnuto/do/ze site)
   */
  NegativePriceBiasMode: number;

  /**
   * Hodnota ovlivneneho vykonu pri zaporne cene ve wattech
   */
  NegativePriceBiasPower: number;

  /**
   * Priznak nastaveni pri zapornych cenach
   */
  NegativePriceHandling: boolean;

  /**
   * Hodnota zakazanych pretoku pri zaporne cene ve wattech
   */
  NegativePriceOffValue: number;

  /**
   * Rezim stridace pri omezeni pretoku
   */
  OffMode: number;

  /**
   * Hodnota omezenych pretoku ve wattech
   */
  OffValue: number;

  /**
   * Hodnota povolenych pretoku ve wattech
   */
  OnValue: number;

  /**
   * Hodnota ovlivneneho vykonu pri vyhodne cene ve wattech
   */
  ProfitPriceBiasPower: number;

  /**
   * Priznak nastaveni pri vyhodnych cenach
   */
  ProfitPriceHandling: boolean;

  /**
   * Maximalni pocet ctvrthodin exportu pri vyhodnych cenach
   */
  ProfitPriceMaxQuarterCount: number;

  /**
   * Minimalni stav nabiti akumulatoru v procentech pri vyhodnych cenach
   */
  ProfitPriceMinBatterySoC: number;

  /**
   * Minimalni castka pro vyhodnou cenu
   */
  ProfitPriceMinValue: number;

  /**
   * Priznak rizeni pomoci EC
   */
  Status: boolean;
};

/**
 * Typ pro data formulare pro nastaveni RTC stridace
 */
export type RealTimeClockFormType = {
  [K in Extract<keyof RegistryType, typeof KEY_DATE_TIME>]: RegistryType[K];
};

/**
 * Typ pro formular nastaveni registru stridace (bez nastaveni RTC)
 */
export type RegistryFormType = {
  [K in keyof Omit<RegistryType, typeof KEY_DATE_TIME>]: RegistryType[K];
};

/**
 * Typ pro nastaveni registru FVE
 */
export type RegistryType = {

  /**
   * Rezim ovlivneni pretoku
   */
  [KEY_BIAS_MODE]: number;

  /**
   * Hodnota ovlivneni pretoku
   */
  [KEY_BIAS_POWER]: number;

  /**
   * Cas stridace
   */
  [KEY_DATE_TIME]: string;

  /**
   * Rizeni hodnoty pretoku
   */
  [KEY_EXPORT_CONTROL]: number;

  /**
   * Nastaveni nuceneho nabijeni/vybijeni v manualnim rezimu
   */
  [KEY_MANUAL_MODE_CHARGING]: number;

  /**
   * Minimalni hodnota SOC akumulatoru (v procentech)
   */
  [KEY_SELF_USE_MIN_SOC]: number;

  /**
   * Behovy rezim stridace
   */
  [KEY_WORKING_MODE]: number;
};

/**
 * Typ pro nastaveni FVE
 */
export type SettingsType = {

  /**
   * Nazev WIFI zarizeni
   */
  DongleID: string;

  /**
   * Rizeni exportu
   */
  Export: ExportType;

  /**
   * IP adresa WIFI zarizeni
   */
  Location: string;

  /**
   * Prubehove mereni: 0 = hodinove, 1 = ctvrthodinove
   */
  MeteringInterval: number;

  /**
   * "Chytre nabijeni"
   */
  SmartCharge: SmartChargeType;

  /**
   * "Chytry export"
   */
  SmartExport: SmartExportType;

  /**
   * Odberne misto
   */
  SupplyPoint: SupplyPointType;

  /**
   * Informace o systemu
   */
  System: SystemType;

  /**
   * Cenovy prah
   */
  Threshold: number;

  /**
   * Uroven "ukecanosti" spoustece
   */
  VerboseLevel: number;
};

/**
 * Typ pro "chytre nabijeni"
 */
export type SmartChargeType = {

  /**
   * Koncova hodina rizeni SmC
   */
  HourEnd: number;

  /**
   * Pocatecni hodina rizeni SmC
   */
  HourStart: number;

  /**
   * Priznak manualniho rizeni pomoci spotovych cen
   */
  ManualControl: boolean;

  /**
   * Minimalni stav nabiti akumulatoru v procentech
   * * Hodnota, pod kterou se bude spoustet nabijeni
   */
  MinBatterySoC: number;

  /**
   * Koncovy mesic jako hodnota intervalu rizeni SmC
   */
  MonthEnd: number;

  /**
   * Pocatecni mesic jako hodnota intervalu rizeni SmC
   */
  MonthStart: number;

  /**
   * Max. vykon panelu FVE, pri kterem se nebude nabijet
   */
  OffPVEPower: number;

  /**
   * Pocet minimalnich cen
   */
  PricesCount: number;

  /**
   * Priznak rizeni pomoci SmC
   */
  Status: boolean;
};

/**
 * Typ pro "chytry export"
 */
export type SmartExportType = {

  /**
   * Koncova hodina rizeni SmE
   */
  HourEnd: number;

  /**
   * Pocatecni hodina rizeni SmE
   */
  HourStart: number;

  /**
   * Minimalni stav nabiti akumulatoru v procentech
   */
  MinBatterySoC: number;

  /**
   * Minimalni vykon FVE
   */
  MinPVEPower: number;

  /**
   * Koncovy mesic jako hodnota intervalu rizeni SmE
   */
  MonthEnd: number;

  /**
   * Pocatecni mesic jako hodnota intervalu rizeni SmE
   */
  MonthStart: number;

  /**
   * Pocet ctvrthodin pod cenovym prahem
   */
  QuartersBelowThreshold: number;

  /**
   * Priznak rizeni pomoci SmE
   */
  Status: boolean;
};

/**
 * Typ pro odberne misto
 */
export type SupplyPointType = {

  /**
   * Hodnota jistice
   */
  CircuitBreakerValue: number;

  /**
   * Normalizovane napeti
   */
  NormalizedVoltage: number;

  /**
   * Pocet fazi
   */
  PhasesCount: number;
};

/**
 * Typ pro informace o systemu
 */
export type SystemType = {

  /**
   * Datum spusteni FVE systemu ve formatu RRRR-MM-DD
   */
  Date: string;

  /**
   * Nazev instalace
   */
  Name: string;

  /**
   * Velikost FVE systemu ve wattech
   */
  Size: number;
};
