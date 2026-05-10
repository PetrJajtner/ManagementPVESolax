/**
 * Token pro poskytnuti informaci o aplikaci
 *
 * @author     Ing. Petr Jajtner <petr@jajtnerovi.cz>
 * @copyright  Ing. Petr Jajtner 2026
 */
import { InjectionToken } from '@angular/core';

/**
 * Informace o aplikaci
 */
export type AppInfo = {
  build:   string;
  date:    string;
  name:    string;
  version: string;
};

/**
 * Token pro injektovani informaci o aplikaci
 */
const APP_INFO_TOKEN = 'APP_INFO';


/**
 * Data informaci o aplikaci
 */
export const APP_INFO = new InjectionToken<AppInfo>(APP_INFO_TOKEN, {
  providedIn: 'root',
  factory:    () => ({
    build:   '-',
    date:    '0000-00-00',
    name:    'Unknown name',
    version: '0.0.0'
  })
});
