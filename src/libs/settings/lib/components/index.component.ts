import {
  ChangeDetectionStrategy, Component, EffectCleanupRegisterFn, Signal, computed,
  effect, inject, signal, untracked
} from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  BIAS_MODES, KEY_DATE_TIME, MANUAL_MODES, REGISTRY_RTC_NOW, WORKING_MODES
} from '@libs/pve';
import {
  BitMaskComponent, ConfigService, DateFmtPipe, DateUtils, ErrorsPipe,
  I18nService, THEME_DARK, THEME_LIGHT, Theme, TranslatePipe
} from '@libs/shared';
import {
  ERROR_MAP, METERING_INVERVALS, RealTimeClockFormType, RegistryFormType,
  RegistryType, SettingsType, VERBOSE_LEVELS
} from '../models/settings.model';
import {
  RealTimeClockForm, RegistryForm, SettingsForm, SettingsService
} from '../services/settings.service';

/**
 * Data komponenty
 */
type ComponentData = {
  months:            string[];
  realTimeClockForm: FormGroup<RealTimeClockForm>;
  registryData?:     RegistryType;
  registryForm:      FormGroup<RegistryForm>;
  settingsData?:     SettingsType;
  settingsForm:      FormGroup<SettingsForm>;
};

/**
 * Data a časy
 */
type DateTimeType = {
  current:  string;
  inverter: string;
};

/**
 * Komponenta nastaveni
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host:            {class: 'settings'},
  imports:         [
    BitMaskComponent,
    DateFmtPipe,
    ErrorsPipe,
    FormsModule,
    ReactiveFormsModule,
    TranslatePipe
  ],
  selector:        'main',
  templateUrl:     './index.component.html'
})
export class IndexComponent {

  /**
   * Sluzba pro nacteni konfigurace aplikace
   */
  private __configSrv: ConfigService = inject<ConfigService>(ConfigService);

  /**
   * Sluzba zajistujici lokalizaci aplikace
   */
  private __i18nSrv: I18nService = inject<I18nService>(I18nService);

  /**
   * Sluzba pro nastaveni rizeni FVE
   */
  private __settingsSrv: SettingsService = inject<SettingsService>(SettingsService);

  /**
   * Jazyky
   */
  private __appLanguages: {label: string; value: string}[] = this.__configSrv.availableLanguages.map((language) => {
    return {label: language, value: language};
  });

  /**
   * Seznam barevnych temat
   */
  private __appThemes: { label: string; value: string }[] = [
    {label: 'SettingsThemeSystem', value: ''},
    {label: 'SettingsThemeLight', value: THEME_LIGHT},
    {label: 'SettingsThemeDark', value: THEME_DARK}
  ];

  /**
   * Signal mesicu
   */
  private __monthsSg: Signal<string[]> = computed(() => {
    const language = this.__i18nSrv.languageSg();
    return [...Array(12).keys()].map((key: number) => {
      return new Date(0, key).toLocaleString(language, {month: 'long'});
    });
  });

  /**
   * Signal dat komponenty
   */
  private __dataSg: Signal<ComponentData> = computed(() => {
    const
      months = this.__monthsSg(),
      registryData = this.__settingsSrv.registrySg(),
      settingsData = this.__settingsSrv.settingsSg(),
      registryForm = this.__settingsSrv.registryForm,
      settingsForm = this.__settingsSrv.settingsForm,
      realTimeClockForm = this.__settingsSrv.realTimeClockForm
    ;

    if (settingsData && registryData) {
      const
        rtcData = {[KEY_DATE_TIME]: registryData[KEY_DATE_TIME].slice(0, 16)} as RealTimeClockFormType, // zkraceni data na 16 znaku
        registry = Object.entries(registryData).reduce((acc: RegistryFormType, [key, value]: [string, string | number]) => {
          return KEY_DATE_TIME === key ? acc : {...acc, [key]: value};
        }, {} as RegistryFormType)
      ;

      registryForm.setValue(registry);
      settingsForm.setValue(settingsData);
      realTimeClockForm.setValue(rtcData);
    }

    return {
      months,
      realTimeClockForm,
      registryData,
      registryForm,
      settingsData,
      settingsForm
    };
  });

  /**
   * Signal dat a casu z registru stridace
   */
  private __dateTimesSg: Signal<DateTimeType> = (() => {
    const timestampsSg = signal<[number, number]>([0, 0]); /* [inv, cur] */

    effect((onCleanup: EffectCleanupRegisterFn) => {
      const dateTime = this.__settingsSrv.registrySg()?.[KEY_DATE_TIME];
      if (undefined === dateTime) {
        return;
      }

      const timestamp = +new Date(dateTime);
      if (untracked(timestampsSg)[0] !== timestamp) {
        timestampsSg.set([timestamp, Date.now()]);
      }

      const handle = setInterval(() => {
        timestampsSg.update(([inv, cur]: [number, number]) => {
          const now = Date.now();
          return [inv + (now - cur), now];
        });
      }, 999);

      onCleanup(() => {
        clearTimeout(handle);
      });
    });

    return computed<DateTimeType>(() => {
      const [inv, cur] = timestampsSg();
      return {
        current:  DateUtils.LocalISO(cur),
        inverter: DateUtils.LocalISO(inv)
      };
    });
  })();

  /**
   * Getter aktualniho jazyka
   */
  public get appLanguage(): string {
    return this.__i18nSrv.language;
  }

  /**
   * Setter jazyka
   */
  public set appLanguage(value: string) {
    this.__i18nSrv && value && (this.__i18nSrv.language = value);
  }

  /**
   * Getter dostupnych jazyku
   */
  public get appLanguages(): { label: string; value: string }[] {
    return this.__appLanguages;
  }

  /**
   * Getter ulozeneho barevneho tematu
   */
  public get appTheme(): string {
    return this.__configSrv.storedThemeSg() ?? '';
  }

  /**
   * Setter ulozeneho barevneho tematu
   */
  public set appTheme(value: string) {
    this.__configSrv.storedThemeSg.set((value.trim() || undefined) as Theme | undefined);
  }

  /**
   * Getter seznamu barevnych temat
   */
  public get appThemes(): { label: string; value: string }[] {
    return this.__appThemes;
  }

  /**
   * Getter rezimu ovlivneni
   */
  public get biasModes(): readonly string[] {
    return BIAS_MODES;
  }

  /**
   * Getter signalu dat komponenty
   */
  public get dataSg(): Signal<ComponentData> {
    return this.__dataSg;
  }

  /**
   * Getter signalu dat a casu z registru stridace
   */
  public get dateTimesSg(): Signal<DateTimeType> {
    return this.__dateTimesSg;
  }

  /**
   * Getter mapy chybovych hlasek
   */
  public get errorMap(): Readonly<Record<string, string | string[]>> {
    return ERROR_MAP;
  }

  /**
   * Getter rezimu nuceneho nabijeni/vybijeni v manualnim rezimu
   */
  public get manualModes(): readonly string[] {
    return MANUAL_MODES;
  }

  /**
   * Getter typů prubehovych mereni
   */
  public get meteringIntervals(): readonly string[] {
    return METERING_INVERVALS;
  }

  /**
   * Getter urovni "ukecanosti" spoustece
   */
  public get verboseLevels(): Readonly<Record<string, number>> {
    return VERBOSE_LEVELS;
  }

  /**
   * Getter pracovnich rezimu stridace
   */
  public get workingModes(): readonly string[] {
    return WORKING_MODES;
  }

  /**
   * Konstruktor
   */
  public constructor() {
    void this.__settingsSrv.load(); // Vynuti nacteni nastaveni a registru
  }

  /**
   * Porovnavaci funkce
   */
  public compareFn(): number {
    return 0;
  }

  /**
   * Obsluha udalosti po kliku na stav pro rizeni exportu
   */
  public onExportControlChange(event: Event, smartExportStatus: FormControl<boolean>): void {
    if (!(event.target as HTMLInputElement).checked) {
      smartExportStatus.setValue(false);
    }
  }

  /**
   * Ulozi data registru
   */
  public saveRegistry(data?: Partial<RegistryType>): void {
    if (undefined === data) {
      if (!this.__settingsSrv.registryForm.valid) {
        return;
      }
      data = this.__settingsSrv.registryForm.value;
    }
    void this.__settingsSrv.saveRegistry(data);
  }

  /**
   * Ulozi konfiguraci
   */
  public saveSettings(): void {
    if (!this.__settingsSrv.settingsForm.valid) {
      return;
    }
    void this.__settingsSrv.saveSettings(
      this.__settingsSrv.settingsForm.value as SettingsType
    );
  }

  /**
   * Sesynchronizuje cas stridace s casem prohlizece/pocitace
   */
  public syncRTC(): void {
    if (confirm(this.__i18nSrv.translate('RTCConfirmSync'))) {
      this.saveRegistry({DateTime: REGISTRY_RTC_NOW});
    }
  }

  /**
   * Otestuje spojeni na stridac Solax
   */
  public testConnection(form: FormGroup<SettingsForm>): void {
    void this.__settingsSrv.testConnection({
      DongleID: form.controls.DongleID.value,
      Location: form.controls.Location.value
    });
  }

}
