import { Pipe, PipeTransform, inject } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { isArray, isObject } from '../models/utils.model';
import { I18nService } from '../services/i18n.service';

/**
 * Typ pro mapu chyb
 */
type ErrorMap = Record<string, string | string[]>;

/**
 * Modifikator pro chybove hlasky formularu
 */
@Pipe({
  name:       'errors',
  standalone: true
})
export class ErrorsPipe implements PipeTransform {

  /**
   * Sluzba zajistujici lokalizaci aplikace
   */
  private __i18nSrv: I18nService = inject(I18nService);

  /**
   * Vlastni transformace
   */
  public transform(errors: ValidationErrors | null, errorMap: ErrorMap | Readonly<ErrorMap>, merge?: ValidationErrors | null): string {
    if (null === errors && !merge) {
      return '';
    }

    const messages = [] as string[];
    for (const [key, value] of Object.entries({...errors, ...(merge ?? {})})) {
      const translationKey: string | string[] | undefined = errorMap[key];
      if (undefined === translationKey) {
        messages.push(true === value ? key : `${key}: ${JSON.stringify(value)}`);
      } else {
        const
          keys = isArray(translationKey) ? [...translationKey] : translationKey,
          keyToTranslate = isArray(keys) ? (keys.shift() ?? '') : (translationKey as string),
          values = isArray(keys) && isObject(value) ? keys.map((objectKey: string) => value[objectKey] as string | number) : ([] as string[])
        ;
        messages.push(this.__i18nSrv.format(keyToTranslate, ...values));
      }
    }

    if (messages.length) {
      return messages.map((message: string) => `• ${message}`)?.[0] ?? '';
    }

    return '';
  }

}
