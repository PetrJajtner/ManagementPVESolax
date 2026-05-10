import { Pipe, PipeTransform } from '@angular/core';

/**
 * Tag BR
 */
const BR_TAG = '<br />';

/**
 * Modifikator pro zalomeni radku.
 */
@Pipe({
  name:       'nl2br',
  standalone: true
})
export class Nl2brPipe implements PipeTransform {

  /**
   * Zalomi radky
   *
   * @example <div [innerText]="'text\r\nse\r\nzalomenim'|nl2br"></div>
   */
  public transform(value?: string): string {
    return value?.replace(/(\\\\r|\r)/g, '').replace(/(\\\\n|\n)/g, BR_TAG) ?? '';
  }

}
