import { Pipe, PipeTransform, inject } from '@angular/core';
import { ConfigService } from '../services/config.service';
import { I18nService } from '../services/i18n.service';

/**
 * Modifikator pro formatovaci data/casu
 */
@Pipe({
  name:       'dateFmt',
  pure:       false,
  standalone: true
})
export class DateFmtPipe implements PipeTransform {

  /**
   * Sluzba pro nacteni konfigurace aplikace
   */
  private __configSrv: ConfigService = inject(ConfigService);

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
      date.setTime(new Date(value).getTime());
    }

    return new Intl.DateTimeFormat(this.__i18nSrv.languageSg(), this.__formatToOptions(format)).format(date);
  }

  /**
   * Prevede format na konfiguraci Intl
   */
  private __formatToOptions(format?: string): Intl.DateTimeFormatOptions {
    const result = {timeZone: this.__configSrv.timezone};

    switch (format) {
      case 'shortDate':
        return {...result, dateStyle: 'short'};

      case 'mediumDate':
        return {...result, dateStyle: 'medium'};

      case 'longDate':
        return {...result, dateStyle: 'long'};

      case 'fullDate':
        return {...result, dateStyle: 'full'};

      case 'shortTime':
        return {...result, timeStyle: 'short'};

      case 'mediumTime':
        return {...result, timeStyle: 'medium'};

      case 'longTime':
        return {...result, timeStyle: 'long'};

      case 'fullTime':
        return {...result, timeStyle: 'full'};

      case 'short':
        return {...result, dateStyle: 'short', timeStyle: 'short'};

      case 'medium':
        return {...result, dateStyle: 'medium', timeStyle: 'medium'};

      case 'long':
        return {...result, dateStyle: 'long', timeStyle: 'long'};

      case 'full':
        return {...result, dateStyle: 'full', timeStyle: 'full'};
    }

    return result;
  }

}
