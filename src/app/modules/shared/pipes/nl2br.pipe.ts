import { Pipe, PipeTransform } from '@angular/core';

/**
 * Tag BR
 */
const BR_TAG = '<br />';

/**
 * Modifikator pro zalomeni radku.
 *
 * @example <div [innerText]="'text\r\nse\r\nzalomenim'|nl2br"></div>
 */
@Pipe({
  name:       'nl2br',
  standalone: false
})
export class Nl2brPipe implements PipeTransform {

  /**
   * Vlastni transformace
   */
  public transform(value?: string): string {
    return value?.replace(/(\\\\r|\r)/g, '').replace(/(\\\\n|\n)/g, BR_TAG) ?? '';
  }

}
