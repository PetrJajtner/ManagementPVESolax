import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '@app/services/i18n.service';

/**
 * Modifikator pro formatovaci data/casu
 */
@Pipe({
  name:       'dateFmt',
  pure:       false,
  standalone: false
})
export class DateFmtPipe implements PipeTransform {

  /**
   * Sluzba zajistujici lokalizaci aplikace
   */
  private __i18nSrv: I18nService = inject(I18nService);

  /**
   * Vlastni transformace
   */
  public transform(value: Date | string | number | null | undefined, format: string = 'full'): string | undefined {
    if (null === value || undefined === value || '' === value) {
      return undefined;
    }

    const date = new Date(0);
    if (value instanceof Date) {
      date.setTime(value.getTime());
    }
    if ('string' === typeof value || 'number' === typeof value) {
      date.setTime((new Date(value)).getTime());
    }

    return (new Intl.DateTimeFormat(this.__i18nSrv.languageSg(), this.__formatToOptions(format))).format(date);
  }

  /**
   * Prevede format na konfiguraci Intl
   */
  private __formatToOptions(format?: string): Intl.DateTimeFormatOptions {
    switch (format) {
      case 'shortDate':
        return {dateStyle: 'short'};

      case 'mediumDate':
        return {dateStyle: 'medium'};

      case 'longDate':
        return {dateStyle: 'long'};

      case 'fullDate':
        return {dateStyle: 'full'};

      case 'shortTime':
        return {timeStyle: 'short'};

      case 'mediumTime':
        return {timeStyle: 'medium'};

      case 'longTime':
        return {timeStyle: 'long'};

      case 'fullTime':
        return {timeStyle: 'full'};

      case 'short':
        return {dateStyle: 'short', timeStyle: 'short'};

      case 'medium':
        return {dateStyle: 'medium', timeStyle: 'medium'};

      case 'long':
        return {dateStyle: 'long', timeStyle: 'long'};

      case 'full':
        return {dateStyle: 'full', timeStyle: 'full'};
    }

    return {};
  }

}
