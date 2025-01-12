import { Pipe, PipeTransform, inject } from '@angular/core';
import { isArray, isNumeric, isString } from '@app/models/utils.model';
import { I18nService } from '@app/services/i18n.service';

/**
 * Typ pro argumenty
 */
type Arg = string | {context: string} | undefined | null;

/**
 * Typ prekladane hodnoty
 */
type Value = string | string[] | null | undefined;

/**
 * Modifikator pro preklady
 */
@Pipe({
  name:       'translate',
  pure:       false,
  standalone: false
})
export class TranslatePipe implements PipeTransform {

  /**
   * Sluzba zajistujici lokalizaci aplikace
   */
  private __i18nSrv: I18nService = inject(I18nService);

  /**
   * Vlastni transformace
   */
  public transform(value: Value, ...args: Arg[]): string {
    if (undefined === value || null === value || '' === value) {
      return '';
    }
    if (isNumeric(value)) {
      return `${value}`;
    }
    if (isString(value)) {
      return this.__translate(value, ...args);
    }
    if (isArray(value) && value.length) {
      return value.map((v: string) => this.__translate(v, ...args)).join(', ');
    }
    return '';
  }

  /**
   * Prelozi retezec
   */
  private __translate(value: string, ...args: Arg[]): string {
    if (!args.length) {
      return this.__i18nSrv.translations[value] ?? value;
    }
    if (null === args[0]) {
      return this.__i18nSrv.hasTranslation(value) ? this.__i18nSrv.translations[value] : value;
    }
    if (undefined === args[0]) {
      return this.__i18nSrv.translate(value, args[0], args?.[1] as (string | undefined));
    }
    if (isString(args[0]) && 'id' === args[0]) {
      return args?.[1] as (string | undefined) ?? value;
    }
    return this.__i18nSrv.translate(value, ...(args as (string | undefined)[]));
  }

}
