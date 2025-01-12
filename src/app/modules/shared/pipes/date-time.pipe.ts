import { Pipe, PipeTransform } from '@angular/core';
import { isDate, isDateTime, isNumber, isString } from '@app/models/utils.model';
import { DateTime } from 'luxon';

/**
 * Typ pro datum jako vstupu
 */
type DateValue = DateTime | Date | string | number | null | undefined;

/**
 * Alternativa k pipe Date s pouzitim knihovny Luxon
 */
@Pipe({
  name:       'dateTime',
  pure:       false,
  standalone: false
})
export class DateTimePipe implements PipeTransform {

  /**
   * Vlastni transformace
   */
  public transform(value: DateValue, ...args: string[]): string | undefined {
    let dateTime: any;

    if (isDateTime(value)) {
      dateTime = value;
    } else if (isDate(value)) {
      dateTime = DateTime.fromJSDate(value);
    } else if (isNumber(value) && value) {
      dateTime = DateTime.fromMillis(value);
    } else if (isString(value) && value) {
      dateTime = DateTime.fromISO(value);
    }

    if (dateTime instanceof DateTime) {
      const format = args[0] || 'FFFF';
      return dateTime.toFormat(format);
    }

    return undefined;
  }

}
