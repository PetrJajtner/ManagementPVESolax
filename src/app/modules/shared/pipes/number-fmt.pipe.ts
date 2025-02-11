import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '@app/services/i18n.service';

/**
 * Regularni vyraz pro formatovani cisla
 */
const NUMBER_FORMAT_REGEXP = /^(\d+)?\.((\d+)(-(\d+))?)?$/;

/**
 * Modifikator pro formatovani cisel
 */
@Pipe({
  name:       'numberFmt',
  pure:       false,
  standalone: false
})
export class NumberFmtPipe implements PipeTransform {

  /**
   * Sluzba zajistujici lokalizaci aplikace
   */
  private __i18nSrv: I18nService = inject(I18nService);

  /**
   * Vlastni transformace
   */
  public transform(value: number | string | null | undefined, digitsInfo?: string): string | undefined {
    if (null === value || undefined === value || '' === value) {
      return undefined;
    }

    let aNumber = NaN;
    if ('string' === typeof value && !isNaN(+value)) {
      aNumber = +value;
    }
    if ('number' === typeof value) {
      aNumber = +value;
    }
    if (isNaN(aNumber)) {
      throw new Error(`${value} is not a number`);
    }

    const options = {} as Intl.NumberFormatOptions;
    if (digitsInfo) {
      const parts = digitsInfo.match(NUMBER_FORMAT_REGEXP);
      if (null === parts) {
        throw new Error(`${digitsInfo} is not a valid digit info`);
      }
      if (undefined !== parts[1]) {
        options.minimumIntegerDigits = +parts[1];
      }
      if (undefined !== parts[3]) {
        options.minimumFractionDigits = +parts[3];
      }
      if (undefined !== parts[5]) {
        options.maximumFractionDigits = +parts[5];
      }
      if (undefined !== options.minimumFractionDigits &&
          undefined !== options.maximumFractionDigits &&
          options.minimumFractionDigits > options.maximumFractionDigits) {
        options.maximumFractionDigits = options.minimumFractionDigits;
      }
    }

    return (new Intl.NumberFormat(this.__i18nSrv.languageSg(), options)).format(aNumber);
  }

}
