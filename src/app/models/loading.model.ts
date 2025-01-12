import { Signal, WritableSignal, computed, signal } from '@angular/core';

/**
 * Trida pro citac „loaderu“
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2018 - nyni
 */
export class Loading {

  /**
   * Priznak nacitani
   */
  protected _isLoadingSg: Signal<boolean> = computed(() => 0 < this.__counterSg());

  /**
   * Pocet „loaderu“
   */
  private __counterSg: WritableSignal<number> = signal<number>(0);

  /**
   * Getter pro priznak vyckavani
   */
  protected get _isLoading(): boolean {
    return this._isLoadingSg();
  }

  /**
   * Setter priznaku vyckavani
   */
  protected set _isLoading(state: boolean) {
    this.__counterSg.update((value: number) => {
      let result = state ? ++value : --value;
      if (0 > result) {
        result = 0;
      }
      return result;
    });
  }

}
