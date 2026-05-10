import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Provider,
  ViewEncapsulation, forwardRef, inject
} from '@angular/core';
import {
  ControlValueAccessor, FormControl, FormGroup, NG_VALUE_ACCESSOR,
  ReactiveFormsModule
} from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Typ pro zmenu modelu
 */
type ModelChangeFn = (value: number) => void;

/**
 * Typ pro pristup k modelu
 */
type ModelTouchedFn = () => void;

/**
 * Poskytovatel pristupoveho objektu
 */
export const BITMASK_VALUE_ACCESSOR: Provider = {
  multi:       true,
  provide:     NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => BitMaskComponent)
};

/**
 * Komponenta pro bitovou masku
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation:   ViewEncapsulation.None,
  imports:         [
    ReactiveFormsModule,
    KeyValuePipe,
    TranslatePipe
  ],
  providers:       [BITMASK_VALUE_ACCESSOR],
  selector:        'bitmask',
  standalone:      true,
  templateUrl:     './bit-mask.component.html'
})
export class BitMaskComponent implements ControlValueAccessor {

  /**
   * Detektor zmen
   */
  public cd: ChangeDetectorRef = inject<ChangeDetectorRef>(ChangeDetectorRef);

  /**
   * Skupina ovladacich prvku (zaskrtavacich poli)
   */
  private __formGroup = new FormGroup<Record<string, FormControl<boolean>>>({});

  /**
   * Priznak zakazaneho prvku
   */
  private __isDisabled: boolean = false;

  /**
   * Funkce pro zmenu modelu
   */
  private __onModelChange: ModelChangeFn = () => {};

  /**
   * Funkce pro zasah modelu
   */
  private __onModelTouched: ModelTouchedFn = () => {};

  /**
   * Moznosti bitove masky - klic = nazev bitu, hodnota = hodnota bitu
   */
  private __options: Readonly<Record<string, number>> = Object.freeze({});

  /**
   * Hodnota komponenty
   */
  private __value: number = 0;

  /**
   * Getter priznaku zakazaneho prvku
   */
  public get disabled(): boolean {
    return this.__isDisabled;
  }

  /**
   * Setter priznaku zakazaneho prvku
   */
  @Input()
  public set disabled(value: boolean) {
    this.setDisabledState(value);
  }

  /**
   * Getter skupiny ovladacich prvku
   */
  public get formGroup(): FormGroup<Record<string, FormControl<boolean>>> {
    return this.__formGroup;
  }

  /**
   * Setter moznosti bitove masky
   */
  @Input()
  public set options(value: Readonly<Record<string, number>>) {
    this.__options = value;

    const formKeys = Object.keys(this.__formGroup.controls);
    if (0 < formKeys.length) {
      for (const formKey of formKeys) {
        (this.__formGroup as FormGroup).removeControl(formKey);
      }
    }

    this.writeValue(this.__value);
  }

  /**
   * Getter hodnoty komponenty
   */
  public get value(): number {
    return this.__value;
  }

  /**
   * Setter hodnoty komponenty
   */
  @Input()
  public set value(value: number | null | undefined) {
    value ??= 0;
    value !== this.__value && this.writeValue((this.__value = value));
  }

  /**
   * Obsluha udalosti po zmene hodnoty zaskrtavaciho pole (bitu)
   */
  public onChangeBit(): void {
    const mask = Object.entries(this.__formGroup.controls).reduce(
      (acc: number, [key, control]: [string, FormControl<boolean>]) => {
        return control.value ? acc | (this.__options[key] as number) : acc;
      },
      0
    );
    this.__onModelChange((this.__value = mask));
    this.__onModelTouched();
  }

  /**
   * Zaregistruje obsluhu zmeny hodnoty ciselneho pole
   */
  public registerOnChange(fn: ModelChangeFn): void {
    this.__onModelChange = fn;
  }

  /**
   * Zaregistruje obsluhu pristupu ciselneho pole
   */
  public registerOnTouched(fn: ModelTouchedFn): void {
    this.__onModelTouched = fn;
  }

  /**
   * Nastavi nepristupny stav
   */
  public setDisabledState(isDisabled: boolean): void {
    this.__isDisabled = isDisabled;
    this.__isDisabled ? this.__formGroup.disable() : this.__formGroup.enable();
    this.cd.markForCheck();
  }

  /**
   * Zaktualizuje model
   */
  public updateModel(event: Event, value: number): void {
    if (this.value !== value) {
      this.__onModelChange((this.value = value));
    }
    this.__onModelTouched();
  }

  /**
   * Zapise hodnotu do modelu
   */
  public writeValue(value: number): void {
    if (0 === Object.keys(this.__options).length) {
      this.__value = value;
      return;
    }

    const booleanValues = Object.entries(this.__options).reduce(
      (acc: Record<string, boolean>, [key, bit]: [string, number]) => {
        return { ...acc, [key]: 0 !== (value & bit) };
      },
      {} as Record<string, boolean>
    );
    if (0 === Object.keys(this.__formGroup.controls).length) {
      for (const [key, bool] of Object.entries(booleanValues)) {
        this.__formGroup.addControl(
          key,
          new FormControl<boolean>(bool, { nonNullable: true })
        );
      }
    } else {
      this.__formGroup.patchValue(booleanValues, { emitEvent: false });
    }

    this.cd.markForCheck();
  }

}
