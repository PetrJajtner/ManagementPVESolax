/**
 * Model dat FVE
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2024 - nyni
 */

/**
 * Rezimy ovlivneni pretoku
 */
export const BIAS_MODES: readonly string[] = Object.freeze([
  /* 0 => */ 'BiasModeDisabled', // Ovlivneni zakazano
  /* 1 => */ 'BiasModeGrid',     // Ovlivneni smerem do site
  /* 2 => */ 'BiasModeINV'       // Ovlivneni smerem ze site
]);

/**
 * Nazev klice pro nastaveni rezimu ovlivneni pretoku
 */
export const KEY_BIAS_MODE = 'BiasMode';

/**
 * Nazev klice pro nastaveni hodnoty ovlivnenych pretoku
 */
export const KEY_BIAS_POWER = 'BiasPower';

/**
 * Nazev klice pro nastaveni hodnoty pretoku
 */
export const KEY_EXPORT_CONTROL = 'ExportControl';

/**
 * Nazev klice pro nastaveni nuceneho nabijeni/vybijeni v manualnim rezimu
 */
export const KEY_MANUAL_MODE_CHARGING = 'ManualModeCharging';

/**
 * Minimalni SOC akumulatoru v rezimu vlastni spotreby
 */
export const KEY_SELF_USE_MIN_SOC = 'SelfUseMinSoC';

/**
 * Nazev klice pro nastaveni behoveho rezim stridace
 */
export const KEY_WORKING_MODE = 'WorkingMode';

/**
 * Rezimy nuceneho nabijeni/vybijeni v manualnim rezimu
 */
export const MANUAL_MODES: readonly string[] = Object.freeze([
  /* 0 => */ 'ManualModeChargingOff',   // Nucene nabijeni/vybijeni vypnuto
  /* 1 => */ 'ManualModeForceCharge',   // Nucene nabijeni
  /* 2 => */ 'ManualModeForceDischarge' // Nucene vybijeni
]);

/**
 * Behove rezimy stridace
 */
export const WORKING_MODES = Object.freeze([
  /* 0 => */ 'WorkingModeSelfUse', // Vlastni spotreba
  /* 1 => */ 'WorkingModeFeedIn',  // Priorita pretoku do verejne distribucni site
  /* 2 => */ 'WorkingModeBackup',  // Rezim zalohy
  /* 3 => */ 'WorkingModeManual'   // Manual
]);

/**
 * Popis hodnoty
 */
export type Description = {
  value: string;
  unit:  null;
};

/**
 * Namerena hodnota
 */
export type Measurement = {
  value: number;
  unit?: string | null;
};

/**
 * Ziva data FVE
 */
export type RealTimeData = {
  ACPowerTotal?:                Measurement;
  BatteryChargeEnergyToday?:    Measurement;
  BatteryChargeEnergyTotal?:    Measurement;
  BatteryCurrent?:              Measurement;
  BatteryDischargeEnergyToday?: Measurement;
  BatteryDischargeEnergyTotal?: Measurement;
  BatteryMode?:                 Measurement;
  BatteryModeText?:             Description;
  BatteryPower?:                Measurement;
  BatteryRemainingCapacity?:    Measurement;
  BatteryRemainingEnergy?:      Measurement;
  BatteryTemperature?:          Measurement;
  BatteryVoltage?:              Measurement;
  BMSStatus?:                   Measurement;
  ConsumedEnergyToday?:         Measurement;
  ConsumedEnergyTotal?:         Measurement;
  Date?:                        string;
  EPS1Current?:                 Measurement;
  EPS1Power?:                   Measurement;
  EPS1Voltage?:                 Measurement;
  EPS2Current?:                 Measurement;
  EPS2Power?:                   Measurement;
  EPS2Voltage?:                 Measurement;
  EPS3Current?:                 Measurement;
  EPS3Power?:                   Measurement;
  EPS3Voltage?:                 Measurement;
  EPSEnergyToday?:              Measurement;
  EPSEnergyTotal?:              Measurement;
  FeedInEnergyToday?:           Measurement;
  FeedInEnergyTotal?:           Measurement;
  Grid1Current?:                Measurement;
  Grid1Frequency?:              Measurement;
  Grid1Power?:                  Measurement;
  Grid1Voltage?:                Measurement;
  Grid2Current?:                Measurement;
  Grid2Frequency?:              Measurement;
  Grid2Power?:                  Measurement;
  Grid2Voltage?:                Measurement;
  Grid3Current?:                Measurement;
  Grid3Frequency?:              Measurement;
  Grid3Power?:                  Measurement;
  Grid3Voltage?:                Measurement;
  GridPower?:                   Measurement;
  Id?:                          string;
  LoadPower?:                   Measurement;
  PV1Current?:                  Measurement;
  PV1Power?:                    Measurement;
  PV1Voltage?:                  Measurement;
  PV2Current?:                  Measurement;
  PV2Power?:                    Measurement;
  PV2Voltage?:                  Measurement;
  PVEnergyTotal?:               Measurement;
  PVETodayYield?:               Measurement;
  RadiatorTemperature?:         Measurement;
  RadiatorTemperatureInner?:    Measurement;
  RunMode?:                     Measurement;
  RunModeText?:                 Description;
  YieldToday?:                  Measurement;
  YieldTotal?:                  Measurement;
};

/**
 * Hodnoty registru stridace
 */
export type RegistryData = {
  [KEY_BIAS_MODE]?:            Measurement;
  BiasModeText?:               Description;
  [KEY_BIAS_POWER]?:           Measurement;
  [KEY_EXPORT_CONTROL]?:       Measurement;
  [KEY_MANUAL_MODE_CHARGING]?: Measurement;
  [KEY_SELF_USE_MIN_SOC]?:     Measurement;
  [KEY_WORKING_MODE]?:         Measurement;
  WorkingModeText?:            Description;
};

/**
 * Ziva data FVE
 */
export type LiveData = RealTimeData & RegistryData;
