import { Injectable, Signal, WritableSignal, inject, signal } from '@angular/core';
import {
  FormBuilder, FormControl, FormControlOptions, FormGroup, Validators
} from '@angular/forms';
import {
  KEY_BIAS_MODE, KEY_BIAS_POWER, KEY_EXPORT_CONTROL, KEY_MANUAL_MODE_CHARGING,
  KEY_SELF_USE_MIN_SOC, KEY_WORKING_MODE, LiveData, MANUAL_MODES, RegistryData,
  WORKING_MODES
} from '@app/models/pve.model';
import {
  DistributionType, ExportType, RegistryType, SettingsType, SmartChargeType,
  SmartExportType, SupplyPointType, SystemType
} from '@app/models/settings.model';
import { API, API_CONNECTION, API_REGISTRY, API_SETTINGS } from '@app/models/urls.model';
import { isBoolean, isNumeric, isString, logException } from '@app/models/utils.model';
import { I18nService } from '@app/services/i18n.service';
import { PricesService } from '@app/services/prices.service';
import { WaitService } from '@app/services/wait.service';

/**
 * Vychozi prednastavena data nastaveni
 */
export const DEFAULT_SETTINGS: SettingsType = {
  Distribution: {
    ConsumptionMultiplier: 2,
    FixPrice:              200
  },
  DongleID: 'S_________',
  Export:   {
    OffValue: 0,
    OnValue:  10000,
    Status:   false
  },
  Location:     'http://192.168.0.2',
  SmartCharge: {
    HourEnd:       12,
    HourStart:     21,
    MinBatterySoC: 95,
    MonthEnd:      2,
    MonthStart:    11,
    OffPVEPower:   1500,
    PricesCount:   2,
    Status:        false
  },
  SmartExport: {
    HourEnd:             14,
    HoursBelowThreshold: 2,
    HourStart:           5,
    MinBatterySoC:       50,
    MinPVEPower:         750,
    MonthEnd:            10,
    MonthStart:          3,
    PriceMultiplier:     1.25,
    Status:              false,
    UseNegativePrices:   false
  },
  SupplyPoint: {
    CircuitBreakerValue: 25,
    NormalizedVoltage:   230,
    PhasesCount:         3
  },
  System: {
    Name: 'Instalace',
    Size: 10000
  },
  Tax:       1.21,
  Threshold: 1200
} as const;

/**
 * Vychozi prednastavena data registru
 */
export const DEFAULT_REGISTRY: RegistryType = {
  [KEY_BIAS_MODE]:            0,
  [KEY_BIAS_POWER]:           0,
  [KEY_EXPORT_CONTROL]:       0,
  [KEY_MANUAL_MODE_CHARGING]: 0,
  [KEY_SELF_USE_MIN_SOC]:     10,
  [KEY_WORKING_MODE]:         0
};

/**
 * Vzor reg. vyrazu pro identifikator zarizeni
 */
const PATTERN_DONGLE_ID = 'S[A-Z0-9]{9,}';

/**
 * Vzor reg. vyrazu pro hodiny (24hodinovy format)
 */
const PATTERN_HOUR = '(0?[0-9]|1[0-9]|2[0-3])';

/**
 * Vzor reg. vyrazu IP adresu
 */
const PATTERN_IP_ADDRESS = 'https?://((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';

/**
 * Vzor reg. vyrazu pro mesic
 */
const PATTERN_MONTH = '([1-9]|1[0-2])';

/**
 * Vzor reg. vyrazu pro nasobek
 */
const PATTERN_MULTIPLIER = '[0-9]{1,2}([.,][0-9]+)?';

/**
 * Vzor reg. vyrazu pro procenta
 */
const PATTERN_PERCENT = '([0-9]{1,2}|100)';

/**
 * Vzor reg. vyrazu pro cenu
 */
const PATTERN_PRICE = '[0-9]+([.,][0-9]+)?';

/**
 * Vzor reg. vyrazu prave pro jednu cislici
 */
const PATTERN_SINGLE_DIGIT = '[0-9]{1}';

/**
 * Vzor reg. vyrazu pro cele kladne cislo
 */
const PATTERN_UINT = '[0-9]+';

/**
 * Vlastnosti pro fomularovy prvek - identifikator zarizeni
 */
const OPTS_DONGLE: FieldOptions = {
  nonNullable: true,
  validators:  [
    Validators.pattern(PATTERN_DONGLE_ID),
    Validators.required
  ]
};

/**
 * Vlastnosti pro fomularovy prvek - hodiny
 */
const OPTS_HOUR: FieldOptions = {
  nonNullable: true,
  validators:  [
    Validators.pattern(PATTERN_HOUR),
    Validators.required
  ]
};

/**
 * Vlastnosti pro fomularovy prvek - IP adresa
 */
const OPTS_IP: FieldOptions = {
  nonNullable: true,
  validators:  [
    Validators.pattern(PATTERN_IP_ADDRESS),
    Validators.required
  ]
};

/**
 * Vlastnosti pro fomularovy prvek - mesic
 */
const OPTS_MONTH: FieldOptions = {
  nonNullable: true,
  validators:  [
    Validators.pattern(PATTERN_MONTH),
    Validators.required
  ]
};

/**
 * Vlastnosti pro fomularovy prvek - nasobek
 */
const OPTS_MULTIPLIER: FieldOptions = {
  nonNullable: true,
  validators:  [
    Validators.pattern(PATTERN_MULTIPLIER),
    Validators.required
  ]
};

/**
 * Vlastnosti pro fomularovy prvek - procenta
 */
const OPTS_PERCENT: FieldOptions = {
  nonNullable: true,
  validators:  [
    Validators.pattern(PATTERN_PERCENT),
    Validators.required
  ]
};

/**
 * Vlastnosti pro fomularovy prvek - cena
 */
const OPTS_PRICE: FieldOptions = {
  nonNullable: true,
  validators:  [
    Validators.pattern(PATTERN_PRICE),
    Validators.required
  ]
};

/**
 * Vlastnosti pro fomularovy prvek - prave jedna cislice
 */
const OPTS_SINGLE: FieldOptions = {
  nonNullable: true,
  validators:  [
    Validators.pattern(PATTERN_SINGLE_DIGIT),
    Validators.required
  ]
};

/**
 * Vlastnosti pro fomularovy prvek - kladne cele cislo
 */
const OPTS_UINT: FieldOptions = {
  nonNullable: true,
  validators:  [
    Validators.pattern(PATTERN_UINT),
    Validators.required
  ]
};

/**
 * Formularova cast pro distribuci
 */
type DistributionForm = {
  ConsumptionMultiplier: FormControl<number>;
  FixPrice:              FormControl<number>;
};

/**
 * Formularova cast pro nastaveni exportu
 */
type ExportForm = {
  OffValue: FormControl<number>;
  OnValue:  FormControl<number>;
  Status:   FormControl<boolean>;
};

/**
 * Typ pro vlastnosti formularoveho prvku
 */
type FieldOptions = FormControlOptions & {
  nonNullable: true;
};

/**
 * Typ pro formular nastaveni registru stridace
 */
export type RegistryForm = {
  [KEY_BIAS_MODE]:            FormControl<number>;
  [KEY_BIAS_POWER]:           FormControl<number>;
  [KEY_EXPORT_CONTROL]:       FormControl<number>;
  [KEY_MANUAL_MODE_CHARGING]: FormControl<number>;
  [KEY_SELF_USE_MIN_SOC]:     FormControl<number>;
  [KEY_WORKING_MODE]:         FormControl<number>;
};

/**
 * Typ pro formular nastaveni rizeni FVE
 */
export type SettingsForm = {
  Distribution: FormGroup<DistributionForm>;
  DongleID:     FormControl<string>;
  Export:       FormGroup<ExportForm>;
  Location:     FormControl<string>;
  SmartCharge:  FormGroup<SmartChargeForm>;
  SmartExport:  FormGroup<SmartExportForm>;
  SupplyPoint:  FormGroup<SupplyPointForm>;
  System:       FormGroup<SystemForm>;
  Tax:          FormControl<number>;
  Threshold:    FormControl<number>;
};

/**
 * Formularova cast pro „chytre nabijeni“
 */
type SmartChargeForm = {
  HourEnd:       FormControl<number>;
  HourStart:     FormControl<number>;
  MinBatterySoC: FormControl<number>;
  MonthEnd:      FormControl<number>;
  MonthStart:    FormControl<number>;
  OffPVEPower:   FormControl<number>;
  PricesCount:   FormControl<number>;
  Status:        FormControl<boolean>;
};

/**
 * Formularova cast pro „chytre rizeni“
 */
type SmartExportForm = {
  HourEnd:             FormControl<number>;
  HoursBelowThreshold: FormControl<number>;
  HourStart:           FormControl<number>;
  MinBatterySoC:       FormControl<number>;
  MinPVEPower:         FormControl<number>;
  MonthEnd:            FormControl<number>;
  MonthStart:          FormControl<number>;
  PriceMultiplier:     FormControl<number>;
  Status:              FormControl<boolean>;
  UseNegativePrices:   FormControl<boolean>;
};

/**
 * Formularova cast pro odberne misto
 */
type SupplyPointForm = {
  CircuitBreakerValue: FormControl<number>;
  NormalizedVoltage:   FormControl<number>;
  PhasesCount:         FormControl<number>;
};

/**
 * Formularova cast pro informace o systemu
 */
type SystemForm = {
  Name: FormControl<string>;
  Size: FormControl<number>;
};

/**
 * Sluzba pro nastaveni rizeni FVE
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  /**
   * FormBuilder
   */
  private __formBuilder: FormBuilder = inject(FormBuilder);

  /**
   * Sluzba zajistujici lokalizaci aplikace
   */
  private __i18nSrv: I18nService = inject(I18nService);

  /**
   * Sluzba pro nacteni cen OTE
   */
  private __pricesSrv: PricesService = inject(PricesService);

  /**
   * Sluzba pro vyckavani
   */
  private __waitSrv: WaitService = inject(WaitService);

  /**
   * Signal nastaveni registru
   */
  private __registrySg: WritableSignal<RegistryType | undefined> = signal<RegistryType | undefined>(undefined);

  /**
   * Funkce pro prislib nastaveni registru
   */
  private __registryFn: (endPoint?: string) => Promise<RegistryType> = (endPoint: string = API_REGISTRY) => {
    return new Promise<RegistryType>((resolve: (value: RegistryType) => void) => {
      void (async () => {
        try {
          const
            response = await fetch(API.BuildUrl(endPoint)),
            registry = await response.json() as RegistryData,
            data = this.__fixRegistry(registry)
          ;
          this.__registrySg.set(data);
          resolve(data);
        } catch (error) {
          logException('/app/services/SettingsService::__registryFn', error);
        }
      })();
    });
  };

  /**
   * Formular nastaveni registru stridace
   */
  private __registryForm: FormGroup<RegistryForm> = this.__formBuilder.group<RegistryForm>({
    [KEY_BIAS_MODE]:            this.__formBuilder.control<number>(DEFAULT_REGISTRY[KEY_BIAS_MODE], OPTS_SINGLE),
    [KEY_BIAS_POWER]:           this.__formBuilder.control<number>(DEFAULT_REGISTRY[KEY_BIAS_POWER], OPTS_UINT),
    [KEY_EXPORT_CONTROL]:       this.__formBuilder.control<number>(DEFAULT_REGISTRY[KEY_EXPORT_CONTROL], OPTS_UINT),
    [KEY_MANUAL_MODE_CHARGING]: this.__formBuilder.control<number>(DEFAULT_REGISTRY[KEY_MANUAL_MODE_CHARGING], OPTS_UINT),
    [KEY_SELF_USE_MIN_SOC]:     this.__formBuilder.control<number>(DEFAULT_REGISTRY[KEY_SELF_USE_MIN_SOC], OPTS_PERCENT),
    [KEY_WORKING_MODE]:         this.__formBuilder.control<number>(DEFAULT_REGISTRY[KEY_WORKING_MODE], OPTS_SINGLE)
  });

  /**
   * Signal pracovnich dat
   */
  private __settingsSg: WritableSignal<SettingsType | undefined> = signal<SettingsType | undefined>(undefined);

  /**
   * Funkce pro prislib pracovnich dat
   */
  private __settingsFn: (endPoint?: string) => Promise<SettingsType> = (endPoint: string = API_SETTINGS) => {
    return new Promise<SettingsType>((resolve: (value: SettingsType) => void) => {
      void (async () => {
        try {
          const
            response = await fetch(API.BuildUrl(endPoint)),
            settings = await response.json() as Partial<SettingsType>,
            data = this.__fixSettings(settings);
          ;
          this.__settingsSg.set(data);
          resolve(data);
        } catch (error) {
          logException('/app/services/SettingsService::__settingsFn', error);
        }
      })();
    });
  };

  /**
   * Formular nastaveni rizeni FVE
   */
  private __settingsForm: FormGroup<SettingsForm> = this.__formBuilder.group<SettingsForm>({
    Distribution: this.__formBuilder.group<DistributionForm>({
      ConsumptionMultiplier: this.__formBuilder.control<number>(DEFAULT_SETTINGS.Distribution.ConsumptionMultiplier, OPTS_MULTIPLIER),
      FixPrice:              this.__formBuilder.control<number>(DEFAULT_SETTINGS.Distribution.FixPrice, OPTS_PRICE)
    }),
    DongleID: this.__formBuilder.control<string>(DEFAULT_SETTINGS.DongleID, OPTS_DONGLE),
    Export:   this.__formBuilder.group<ExportForm>({
      OffValue: this.__formBuilder.control<number>(DEFAULT_SETTINGS.Export.OffValue, OPTS_UINT),
      OnValue:  this.__formBuilder.control<number>(DEFAULT_SETTINGS.Export.OnValue, OPTS_UINT),
      Status:   this.__formBuilder.control<boolean>(DEFAULT_SETTINGS.Export.Status, {nonNullable: true})
    }),
    Location:    this.__formBuilder.control<string>(DEFAULT_SETTINGS.Location, OPTS_IP),
    SmartCharge: this.__formBuilder.group<SmartChargeForm>({
      HourEnd:       this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartCharge.HourEnd, OPTS_HOUR),
      HourStart:     this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartCharge.HourStart, OPTS_HOUR),
      MinBatterySoC: this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartCharge.MinBatterySoC, OPTS_PERCENT),
      MonthEnd:      this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartCharge.MonthEnd, OPTS_MONTH),
      MonthStart:    this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartCharge.MonthStart, OPTS_MONTH),
      OffPVEPower:   this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartCharge.OffPVEPower, OPTS_UINT),
      PricesCount:   this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartCharge.PricesCount, OPTS_HOUR),
      Status:        this.__formBuilder.control<boolean>(DEFAULT_SETTINGS.SmartCharge.Status, {nonNullable: true})
    }),
    SmartExport: this.__formBuilder.group<SmartExportForm>({
      HourEnd:             this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartExport.HourEnd, OPTS_HOUR),
      HoursBelowThreshold: this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartExport.HoursBelowThreshold, OPTS_SINGLE),
      HourStart:           this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartExport.HourStart, OPTS_HOUR),
      MinBatterySoC:       this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartExport.MinBatterySoC, OPTS_PERCENT),
      MinPVEPower:         this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartExport.MinPVEPower, OPTS_UINT),
      MonthEnd:            this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartExport.MonthEnd, OPTS_MONTH),
      MonthStart:          this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartExport.MonthStart, OPTS_MONTH),
      PriceMultiplier:     this.__formBuilder.control<number>(DEFAULT_SETTINGS.SmartExport.PriceMultiplier, OPTS_MULTIPLIER),
      Status:              this.__formBuilder.control<boolean>(DEFAULT_SETTINGS.SmartExport.Status, {nonNullable: true}),
      UseNegativePrices:   this.__formBuilder.control<boolean>(DEFAULT_SETTINGS.SmartExport.UseNegativePrices, {nonNullable: true})
    }),
    SupplyPoint: this.__formBuilder.group<SupplyPointForm>({
      CircuitBreakerValue: this.__formBuilder.control<number>(DEFAULT_SETTINGS.SupplyPoint.CircuitBreakerValue, OPTS_UINT),
      NormalizedVoltage:   this.__formBuilder.control<number>(DEFAULT_SETTINGS.SupplyPoint.NormalizedVoltage, OPTS_UINT),
      PhasesCount:         this.__formBuilder.control<number>(DEFAULT_SETTINGS.SupplyPoint.PhasesCount, OPTS_SINGLE)
    }),
    System: this.__formBuilder.group<SystemForm>({
      Name: this.__formBuilder.control<string>(DEFAULT_SETTINGS.System.Name, {nonNullable: true, validators: Validators.required}),
      Size: this.__formBuilder.control<number>(DEFAULT_SETTINGS.System.Size, OPTS_UINT)
    }),
    Tax:       this.__formBuilder.control<number>(DEFAULT_SETTINGS.Tax, OPTS_MULTIPLIER),
    Threshold: this.__formBuilder.control<number>(DEFAULT_SETTINGS.Threshold, OPTS_UINT)
  });

  /**
   * Getter formulare nastaveni registru stridace
   */
  public get registryForm(): FormGroup<RegistryForm> {
    return this.__registryForm;
  }

  /**
   * Getter signalu dat registru
   */
  public get registrySg(): Signal<RegistryType | undefined> {
    return this.__registrySg.asReadonly();
  }

  /**
   * Getter formulare nastaveni rizeni FVE
   */
  public get settingsForm(): FormGroup<SettingsForm> {
    return this.__settingsForm;
  }

  /**
   * Getter signalu dat nastaveni
   */
  public get settingsSg(): Signal<SettingsType | undefined> {
    return this.__settingsSg.asReadonly();
  }

  /**
   * Konstruktor
   */
  public constructor() {
    void this.load();
  }

  /**
   * Nacte konfiguraci
   */
  public async load(): Promise<[RegistryType, SettingsType]> {
    this.__waitSrv.wait = true;
    try {
      return Promise.all([
        this.__registryFn(),
        this.__settingsFn()
      ]);
    } finally {
      this.__waitSrv.wait = false;
    }
  }

  /**
   * Ulozi data registru
   */
  public async saveRegistry(values: Partial<RegistryType>): Promise<void> {
    this.__waitSrv.wait = true;
    try {
      const
        fixValues = (values: Partial<RegistryType>): RegistryData => {
          if (values[KEY_WORKING_MODE] === WORKING_MODES.indexOf('WorkingModeSelfUse')) {
            if (undefined !== values[KEY_MANUAL_MODE_CHARGING] && values[KEY_MANUAL_MODE_CHARGING] !== MANUAL_MODES.indexOf('ManualModeChargingOff')) {
              values[KEY_MANUAL_MODE_CHARGING] = MANUAL_MODES.indexOf('ManualModeChargingOff');
            }
          }
          return Object.entries(values).reduce((acc: RegistryData, [key, value]: [string, number]) => {
            return {...acc, [key]: {value}};
          }, {} as RegistryData);
        },
        data = fixValues(values),
        options = {
          body:    JSON.stringify(data),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: {'Content-Type': 'application/json'},
          method:  'POST'
        },
        response = await fetch(API.BuildUrl(API_REGISTRY), options),
        saved = (await response.json() as {Success: boolean})?.Success ?? false
      ;

      if (!saved) {
        alert(this.__i18nSrv.translate('SettingsFailedToSaveRegistry'));
        return;
      }

      this.__registryForm.reset(values);
      this.__registrySg.update((current: RegistryType | undefined) => {
        return {...(current ?? {}), ...values} as RegistryType | undefined;
      });
    } catch {
      alert(this.__i18nSrv.translate('SettingsFailedToSaveRegistry'));
    } finally {
      this.__waitSrv.wait = false;
    }
  }

  /**
   * Ulozi konfiguraci
   */
  public async saveSettings(values: SettingsType): Promise<void> {
    this.__waitSrv.wait = true;
    try {
      const
        fixValues = (values: SettingsType): SettingsType => {
          isString(values.SmartCharge?.MonthEnd) && (values.SmartCharge.MonthEnd = +values.SmartCharge.MonthEnd);
          isString(values.SmartCharge?.MonthStart) && (values.SmartCharge.MonthStart = +values.SmartCharge.MonthStart);
          isString(values.SmartCharge?.PricesCount) && (values.SmartCharge.PricesCount = +values.SmartCharge.PricesCount);
          isString(values.SmartExport?.MonthEnd) && (values.SmartExport.MonthEnd = +values.SmartExport.MonthEnd);
          isString(values.SmartExport?.MonthStart) && (values.SmartExport.MonthStart = +values.SmartExport.MonthStart);
          return values;
        },
        data = fixValues(values),
        options = {
          body:    JSON.stringify(data),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: {'Content-Type': 'application/json'},
          method:  'POST'
        },
        response = await fetch(API.BuildUrl(API_SETTINGS), options),
        saved = (await response.json() as {Success: boolean})?.Success ?? false
      ;

      if (!saved) {
        alert(this.__i18nSrv.translate('SettingsFailedToSaveSettings'));
        return;
      }

      this.__settingsForm.reset(data);
      this.__settingsSg.set(data);

      await this.__pricesSrv.current();
    } catch {
      alert(this.__i18nSrv.translate('SettingsFailedToSaveSettings'));
    } finally {
      this.__waitSrv.wait = false;
    }
  }

  /**
   * Nastavi data registru z externiho zdroje (typicky live-data)
   */
  public setRegistry(data: LiveData): void {
    void Promise.resolve().then(() => this.__registrySg.set(this.__fixRegistry(data)));
  }

  /**
   * Otestuje spojeni na stridac Solax
   */
  public async testConnection(data: Partial<SettingsType>): Promise<void> {
    this.__waitSrv.wait = true;
    try {
      const
        options = {
          body:    JSON.stringify(data),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: {'Content-Type': 'application/json'},
          method:  'POST',
          signal:  AbortSignal.timeout(10000) // 10s
        },
        response = await fetch(API.BuildUrl(API_CONNECTION), options),
        result = (await response.json() as {Success: boolean})?.Success ?? false
      ;

      alert(this.__i18nSrv.translate(result ? 'SettingsConnectionEstablished' : 'SettingsConnectionFailed'));
    } catch (error: unknown) {
      alert(this.__i18nSrv.format('SettingsConnectionTestFailedN', (error as {message: string}).message));
    } finally {
      this.__waitSrv.wait = false;
    }
  }

  /**
   * Upravi data registru
   */
  private __fixRegistry(data: RegistryData): RegistryType {
    const result = {...DEFAULT_REGISTRY} as RegistryType;

    isNumeric(data[KEY_BIAS_MODE]?.value) && (result[KEY_BIAS_MODE] = +data[KEY_BIAS_MODE].value);
    isNumeric(data[KEY_BIAS_POWER]?.value) && (result[KEY_BIAS_POWER] = +data[KEY_BIAS_POWER].value);
    isNumeric(data[KEY_EXPORT_CONTROL]?.value) && (result[KEY_EXPORT_CONTROL] = +data[KEY_EXPORT_CONTROL].value);
    isNumeric(data[KEY_MANUAL_MODE_CHARGING]?.value) && (result[KEY_MANUAL_MODE_CHARGING] = +data[KEY_MANUAL_MODE_CHARGING].value);
    isNumeric(data[KEY_SELF_USE_MIN_SOC]?.value) && (result[KEY_SELF_USE_MIN_SOC] = +data[KEY_SELF_USE_MIN_SOC].value);
    isNumeric(data[KEY_WORKING_MODE]?.value) && (result[KEY_WORKING_MODE] = +data[KEY_WORKING_MODE].value);

    return result;
  }

  /**
   * Upravi data nastaveni
   */
  private __fixSettings(data: Partial<SettingsType>): SettingsType {
    const result = {
      ...DEFAULT_SETTINGS,
      Distribution: {...DEFAULT_SETTINGS.Distribution} as Partial<DistributionType>,
      Export:       {...DEFAULT_SETTINGS.Export} as Partial<ExportType>,
      SmartCharge:  {...DEFAULT_SETTINGS.SmartCharge} as Partial<SmartChargeType>,
      SmartExport:  {...DEFAULT_SETTINGS.SmartExport} as Partial<SmartExportType>,
      SupplyPoint:  {...DEFAULT_SETTINGS.SupplyPoint} as Partial<SupplyPointType>,
      System:       {...DEFAULT_SETTINGS.System} as Partial<SystemType>
    } as SettingsType;

    isNumeric(data.Distribution?.ConsumptionMultiplier) && (result.Distribution.ConsumptionMultiplier = +data.Distribution.ConsumptionMultiplier);
    isNumeric(data.Distribution?.FixPrice) && (result.Distribution.FixPrice = +data.Distribution.FixPrice);

    isString(data.DongleID) && (result.DongleID = `${data.DongleID}`.trim());

    isNumeric(data.Export?.OffValue) && (result.Export.OffValue = +data.Export.OffValue);
    isNumeric(data.Export?.OnValue) && (result.Export.OnValue = +data.Export.OnValue);
    isBoolean(data.Export?.Status) && (result.Export.Status = !!data.Export.Status);

    isString(data.Location) && (result.Location = `${data.Location}`.trim());

    isNumeric(data.SmartCharge?.HourEnd) && (result.SmartCharge.HourEnd = +data.SmartCharge.HourEnd);
    isNumeric(data.SmartCharge?.HourStart) && (result.SmartCharge.HourStart = +data.SmartCharge.HourStart);
    isNumeric(data.SmartCharge?.MinBatterySoC) && (result.SmartCharge.MinBatterySoC = +data.SmartCharge.MinBatterySoC);
    isNumeric(data.SmartCharge?.MonthEnd) && (result.SmartCharge.MonthEnd = +data.SmartCharge.MonthEnd);
    isNumeric(data.SmartCharge?.MonthStart) && (result.SmartCharge.MonthStart = +data.SmartCharge.MonthStart);
    isNumeric(data.SmartCharge?.OffPVEPower) && (result.SmartCharge.OffPVEPower = +data.SmartCharge.OffPVEPower);
    isNumeric(data.SmartCharge?.PricesCount) && (result.SmartCharge.PricesCount = +data.SmartCharge.PricesCount);
    isBoolean(data.SmartCharge?.Status) && (result.SmartCharge.Status = !!data.SmartCharge.Status);

    isNumeric(data.SmartExport?.HourEnd) && (result.SmartExport.HourEnd = +data.SmartExport.HourEnd);
    isNumeric(data.SmartExport?.HoursBelowThreshold) && (result.SmartExport.HoursBelowThreshold = +data.SmartExport.HoursBelowThreshold);
    isNumeric(data.SmartExport?.HourStart) && (result.SmartExport.HourStart = +data.SmartExport.HourStart);
    isNumeric(data.SmartExport?.MinBatterySoC) && (result.SmartExport.MinBatterySoC = +data.SmartExport.MinBatterySoC);
    isNumeric(data.SmartExport?.MinPVEPower) && (result.SmartExport.MinPVEPower = +data.SmartExport.MinPVEPower);
    isNumeric(data.SmartExport?.MonthEnd) && (result.SmartExport.MonthEnd = +data.SmartExport.MonthEnd);
    isNumeric(data.SmartExport?.MonthStart) && (result.SmartExport.MonthStart = +data.SmartExport.MonthStart);
    isNumeric(data.SmartExport?.PriceMultiplier) && (result.SmartExport.PriceMultiplier = +data.SmartExport.PriceMultiplier);
    isBoolean(data.SmartExport?.Status) && (result.SmartExport.Status = !!data.SmartExport.Status);
    isBoolean(data.SmartExport?.UseNegativePrices) && (result.SmartExport.UseNegativePrices = !!data.SmartExport.UseNegativePrices);

    isNumeric(data.SupplyPoint?.CircuitBreakerValue) && (result.SupplyPoint.CircuitBreakerValue = +data.SupplyPoint.CircuitBreakerValue);
    isNumeric(data.SupplyPoint?.NormalizedVoltage) && (result.SupplyPoint.NormalizedVoltage = +data.SupplyPoint.NormalizedVoltage);
    isNumeric(data.SupplyPoint?.PhasesCount) && (result.SupplyPoint.PhasesCount = +data.SupplyPoint.PhasesCount);

    isString(data.System?.Name) && (result.System.Name = `${data.System.Name}`.trim());
    isNumeric(data.System?.Size) && (result.System.Size = +data.System.Size);

    isNumeric(data.Tax) && (result.Tax = +data.Tax);
    isNumeric(data.Threshold) && (result.Threshold = +data.Threshold);

    return result;
  }

}
