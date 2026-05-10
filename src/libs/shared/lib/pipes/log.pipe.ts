import { Pipe, PipeTransform, isDevMode } from '@angular/core';

/**
 * Logovaci modifikator
 */
@Pipe({
  name:       'log',
  pure:       false,
  standalone: true
})
export class LogPipe implements PipeTransform {

  /**
   * Ve vyvojovem modu vypise hodnotu do konzole
   */
  public transform<T, U = any>(value: T, ...args: U[]): T {
    isDevMode() && console.log(value, ...args);
    return value;
  }

}
