import { Pipe, PipeTransform } from '@angular/core';
import { isObject } from '@app/models/utils.model';

/**
 * Prevede objekt na pole klicu
 */
@Pipe({
  name:       'keys',
  standalone: false
})
export class KeysPipe implements PipeTransform {

  /**
   * Vlastni transformace
   */
  public transform(value: unknown): string[] {
    return isObject(value) ? Object.keys(value) : [];
  }

}
