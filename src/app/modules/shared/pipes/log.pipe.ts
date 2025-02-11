import { Pipe, PipeTransform, isDevMode } from '@angular/core';

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
    isDevMode() && console.log(value, ...args);
    return value;
  }

}
