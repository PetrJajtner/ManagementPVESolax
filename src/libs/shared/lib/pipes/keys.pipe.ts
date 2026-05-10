import { Pipe, PipeTransform } from '@angular/core';
import { isObject } from '../models/utils.model';

/**
 * Modifikator pro prevod objektu na pole klicu
 */
@Pipe({
  name:       'keys',
  standalone: true
})
export class KeysPipe implements PipeTransform {

  /**
   * Prevede objekt na pole klicu
   */
  public transform(value: unknown): string[] {
    return isObject(value) ? Object.keys(value) : [];
  }

}
