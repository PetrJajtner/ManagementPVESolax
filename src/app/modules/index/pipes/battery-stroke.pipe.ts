import { Pipe, PipeTransform } from '@angular/core';

/**
 * Modifikator pro zobrazeni barvy akumulatoru
 */
@Pipe({
  name:       'batteryStroke',
  standalone: false
})
export class BatteryStrokePipe implements PipeTransform {

  /**
   * Vlastni transformace procent na barvu
   */
  public transform(value?: number): string {
    if (undefined === value || 0 >= value) {
      return 'none';
    }
    if (0 < value && 10 >= value) {
      return 'red';
    }
    if (10 < value && 25 >= value) {
      return 'gold';
    }
    return 'lime';
  }

}
