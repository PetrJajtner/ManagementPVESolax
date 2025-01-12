import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '@env/environment';

/**
 * Logovaci modifikator
 */
@Pipe({
  name:       'log',
  pure:       false,
  standalone: false
})
export class LogPipe implements PipeTransform {

  /**
   * Vlastni transformace
   */
  public transform<T, U = any>(value: T, ...args: U[]): T {
    !environment.production && console.log(value, ...args);
    return value;
  }

}
