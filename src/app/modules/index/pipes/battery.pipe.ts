import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pasmo nabiteho akumulatoru
 */
const PROGRESS_CHARGED = 'progress-charged';

/**
 * Pasmo vybiteho akumulatoru
 */
const PROGRESS_DISCHARGED = 'progress-discharged';

/**
 * Hranicni pasmo akumulatoru
 */
const PROGRESS_WARNING = 'progress-warning';

/**
 * Modifikator pro CSS tridu akumulatoru
 */
@Pipe({
  name:       'battery',
  standalone: false
})
export class BatteryPipe implements PipeTransform {

  /**
   * Vlastni transformace procent na CSS tridu
   */
  public transform(value?: number): string {
    if (undefined === value || 0 >= value) {
      return '';
    }
    if (0 < value && 10 >= value) {
      return PROGRESS_DISCHARGED;
    }
    if (10 < value && 25 >= value) {
      return PROGRESS_WARNING;
    }
    return PROGRESS_CHARGED;
  }

}
