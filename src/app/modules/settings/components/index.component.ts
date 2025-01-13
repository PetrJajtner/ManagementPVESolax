import { ChangeDetectionStrategy, Component, Signal, computed, inject } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BIAS_MODES, MANUAL_MODES, WORKING_MODES } from '@app/models/pve.model';
import { ERROR_MAP, RegistryType, SettingsType } from '@app/models/settings.model';
import { ConfigService } from '@app/services/config.service';
import { I18nService } from '@app/services/i18n.service';
import { RegistryForm, SettingsForm, SettingsService } from '@app/services/settings.service';

/**
 * Data komponenty
 */
type ComponentData = {
  months:        string[];
  registryData?: RegistryType;
  registryForm:  FormGroup<RegistryForm>;
  settingsData?: SettingsType;
  settingsForm:  FormGroup<SettingsForm>;
};

/**
 * Komponenta nastaveni
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host:            {class: 'settings'},
  selector:        'main',
  standalone:      false,
  templateUrl:     './index.component.html'
})
export class IndexComponent {

  /**
   * Sluzba pro nacteni konfigurace aplikace
   */
  private __configSrv: ConfigService = inject(ConfigService);

  /**
   * Sluzba zajistujici lokalizaci aplikace
   */
  private __i18nSrv: I18nService = inject(I18nService);

  /**
   * Sluzba pro nastaveni rizeni FVE
   */
  private __settingsSrv: SettingsService = inject(SettingsService);

  /**
   * Jazyky
   */
  private __appLanguages: {label: string; value: string}[] = this.__configSrv.availableLanguages.map((language) => {
    return {label: language, value: language};
  });

  /**
   * Signal mesicu
   */
  private __monthsSg: Signal<string[]> = computed(() => {
    const language = this.__i18nSrv.languageSg();
    return [...Array(12).keys()].map((key: number) => {
      return (new Date(0, key)).toLocaleString(language, {month: 'long'});
    });
  });

  /**
   * Signal dat komponenty
   */
  private __dataSg: Signal<ComponentData> = computed(() => {
    const
      months = this.__monthsSg(),
      registryData = this.__settingsSrv.registrySg(),
      registryForm = this.__settingsSrv.registryForm,
      settingsData = this.__settingsSrv.settingsSg(),
      settingsForm = this.__settingsSrv.settingsForm
    ;

    if (settingsData && registryData) {
      registryForm.setValue(registryData);
      settingsForm.setValue(settingsData);
    }

    return {
      months,
      registryData,
      registryForm,
      settingsData,
      settingsForm
    };
  });

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
  public get appLanguages(): {label: string; value: string}[] {
    return this.__appLanguages;
  }

  /**
   * Rezimy ovlivneni
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
   * Getter mapy chybovych hlasek
   */
  public get errorMap(): Readonly<Record<string, string | string[]>> {
    return ERROR_MAP;
  }

  /**
   * Rezimy nuceneho nabijeni/vybijeni v manualnim rezimu
   */
  public get manualModes(): readonly string[] {
    return MANUAL_MODES;
  }

  /**
   * Pracovni rezimy stridace
   */
  public get workingModes(): readonly string[] {
    return WORKING_MODES;
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
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      smartExportStatus.enable();
    } else {
      smartExportStatus.setValue(false);
      smartExportStatus.disable();
    }
  }

  /**
   * Ulozi parcialni data registru
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
   * Obsluha udalosti po odsouhlaseni zmen formulare nastaveni
   */
  public saveSettings(): void {
    if (!this.__settingsSrv.settingsForm.valid) {
      return;
    }
    void this.__settingsSrv.saveSettings(this.__settingsSrv.settingsForm.value as SettingsType);
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
