/**
 * Seznam cest k modulum aplikace
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2024 - nyni
 */
import {
  KEY_BIAS_MODE, KEY_BIAS_POWER, KEY_EXPORT_CONTROL, KEY_MANUAL_MODE_CHARGING,
  KEY_SELF_USE_MIN_SOC, KEY_WORKING_MODE
} from '@app/models/pve.model';

/**
 * Mapa chybovych hlasek
 */
export const ERROR_MAP: Readonly<Record<string, string | string[]>> = Object.freeze({
  minlength:  ['ErrorMinLengthN', 'requiredLength', 'actualLength'],
  pattern:    ['ErrorPatternNotMatchN', 'actualValue', 'requiredPattern'],
  required:  'ErrorRequired'
});

/**
 * Urovne „ukecanosti“ spoustece
 */
export const VERBOSE_LEVELS: readonly string[] = Object.freeze([
  /* 0 => */ 'SettingsVerboseLevelNone',
  /* 1 => */ 'SettingsVerboseLevelChange',
  /* 2 => */ 'SettingsVerboseLevelMessage',
  /* 3 => */ 'SettingsVerboseLevelAll'
]);

/**
 * Typ pro rizeni exportu
 */
export type ExportType = {

  /**
   * Hodnota zakazanych pretoku ve wattech
   */
  OffValue: number;

  /**
   * Hodnota povolenych pretoku ve wattech
   */
  OnValue: number;

  /**
   * Priznak rizeni pomoci EC
   */
  Status: boolean;

  /**
   * Priznak pouziti manualniho rezimu pro vyuziti zapornych cen
   */
  UseManual: boolean;

  /**
   * Priznak vyuziti zapornych cen
   */
  UseNegativePrices: boolean;
};

/**
 * Typ pro „chytre nabijeni“
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
 * Typ pro „chytry export“
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
   * Pocet hodin pod cenovym prahem
   */
  HoursBelowThreshold: number;

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
   * Nasobitel cenoveho prahu
   */
  PriceMultiplier: number;

  /**
   * Priznak rizeni pomoci SmE
   */
  Status: boolean;
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
   * „Chytre nabijeni“
   */
  SmartCharge: SmartChargeType;

  /**
   * „Chytry export“
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
   * Uroven „ukecanosti“ spoustece
   */
  VerboseLevel: number;
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
