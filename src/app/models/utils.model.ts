/**
 * Obecne funkce aplikace
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2019 - nyni
 */
import { environment } from '@env/environment';
import { DateTime } from 'luxon';

/**
 * Bazovy nazev souboru
 */
export function basename(path: string): string {
  return path.split(/[\\/]/).pop() ?? '';
}

/**
 * Test na definovanou promennou
 */
export function isDefined<T>(x: T | undefined | null): x is T {
  return undefined !== x && null !== x;
}

/**
 * Otestuje, zdali je parametr ciselnou hodnotou bez ohledu na typ
 */
export function isNumeric(x: unknown): x is number {
  // eslint-disable-next-line eqeqeq
  return '' !== x && x == +(x as string);
}

/**
 * Otestuje, zdali je parametr cislem
 */
export function isNumber(x: unknown): x is number {
  return 'number' === typeof x;
}

/**
 * Otestuje, zdali je parametr retezec
 */
export function isString(x: unknown): x is string {
  return 'string' === typeof x;
}

/**
 * Otestuje, zdali je parametr funkci
 */
export function isFunction(x: unknown): x is <T = unknown, U = unknown>(args?: T) => U {
  return 'function' === typeof x;
}

/**
 * Otestuje, zdali je parametr objektem
 */
export function isObject<T = any>(x: unknown): x is Record<string, T> {
  return !!x && null !== x && 'object' === typeof x;
}

/**
 * Otestuje, zdali je parametr polem
 */
export function isArray<T = any>(x: unknown): x is T[] {
  return !!x && Array.isArray(x);
}

/**
 * Otestuje, zdali je parametr datem
 */
export function isDate(x: unknown): x is Date {
  return !!x && x instanceof Date;
}

/**
 * Otestuje, zdali je parametr datem typu Luxon
 */
export function isDateTime(x: unknown): x is DateTime {
  return !!x && x instanceof DateTime;
}

/**
 * Otestuje, zdali je parametr regularnim vyrazem
 */
export function isRegExp(x: unknown): x is RegExp {
  return !!x && x instanceof RegExp;
}

/**
 * Otestuje, zdali je parametr iteratorem
 */
export function isSymbolIterator(x: unknown): x is symbol {
  return !!x && x === Symbol.iterator;
}

/**
 * Otestuje, zdali je parametr neco jako Promise
 */
export function isPromise(x: unknown): x is Promise<any> {
  return !!x && x instanceof Promise;
}

/**
 * Otestuje, zdali je parametr logickou hodnotou
 */
export function isBoolean(x: unknown): x is boolean {
  return true === x || false === x;
}

/**
 * Zaokrouhlovani
 */
export function round(value = 0, precision = 4): number {
  const
    factor = Math.pow(10, precision),
    result = Math.round(factor * +value) / factor
  ;
  return +(result.toFixed(precision));
}

/**
 * Jednoduche porovnani typu
 */
export function simpleCompare<T>(a: T, b: T): boolean {
  return a === b || (a !== a && b !== b);
}

/**
 * Porovnani hodnot
 */
export function equals<T>(o1: T, o2: T): boolean {
  if (o1 === o2) {
    return true;
  }
  if (o1 === null || o2 === null) {
    return false;
  }
  if (o1 !== o1 && o2 !== o2) {
    return true; // NaN === NaN
  }

  const t1 = typeof o1, t2 = typeof o2;
  if (t1 === t2 && t1 === 'object') {
    if (Array.isArray(o1)) {
      if (!Array.isArray(o2)) {
        return false;
      }
      const length = o1.length;
      if (length === o2.length) {
        for (let key = 0; key < length; key++) {
          if (!equals(o1[key], o2[key])) {
            return false;
          }
        }
        return true;
      }
    } else if (isDate(o1)) {
      if (!isDate(o2)) {
        return false;
      }
      return simpleCompare(o1.getTime(), o2.getTime());
    } else if (isRegExp(o1)) {
      if (!isRegExp(o2)) {
        return false;
      }
      return o1.toString() === o2.toString();
    } else {
      if (isArray(o2) || isDate(o2) || isRegExp(o2)) {
        return false;
      }
      const keySet = Object.create(null) as Record<string, boolean>;
      for (const key in o1) {
        if (isFunction(o1[key])) {
          continue;
        }
        if (!equals(o1[key], o2?.[key])) {
          return false;
        }
        keySet[key] = true;
      }
      for (const key in o2) {
        if (!(key in keySet) && isDefined(o2[key]) && !isFunction(o2[key])) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

/**
 * Porovnavani verzi
 */
export function versionSort(versionA: string, versionB: string): number {
  const
    a = ('' + versionA).split('.'),
    b = ('' + versionB).split('.')
  ;
  for (let i = 0, m = Math.max(a.length, b.length); i < m; i++) {
    if (!isNumeric(a[i])) {
      return -1;
    }
    if (!isNumeric(b[i])) {
      return 1;
    }
    if (0 !== (+a[i] - +b[i])) {
      return +a[i] - +b[i];
    }
  }
  return 0;
}

/**
 * Setridi objekty pole dle klice
 */
export function sort<T extends object>(arr: T[], key: string, convert?: (v: any) => any): T[] {
  let descending = 1;
  if ('+' === key.charAt(0) || '-' === key.charAt(0)) {
    descending = key.charAt(0) === '-' ? -1 : 1;
    key = key.substring(1);
  }
  return [...arr].sort((a: T, b: T) => {
    if (isObject(a) && key in a && isObject(b) && key in b) {
      const
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        aValue = convert ? convert((a as any)[key]) : (a as any)[key],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        bValue = convert ? convert((b as any)[key]) : (b as any)[key]
      ;
      if (aValue < bValue) {
        return -descending;
      }
      if (aValue > bValue) {
        return descending;
      }
    }
    return 0;
  });
}

/**
 * Naklonuje instanci tridy
 */
export function clone<T extends object>(instance: T): T | undefined {
  if (isObject(instance)) {
    return Object.assign(Object.create(Object.getPrototypeOf(instance)), instance) as T;
  }
  return undefined;
}

/**
 * Vytvori UUID dle RFC 4122
 */
export function UUID(): string {
  const hexDigits = '0123456789abcdef', result: string[] = [];

  for (let i = 0; i < 36; i++) {
    result[i] = hexDigits.charAt(Math.floor(Math.random() * 0x10));
  }

  result[14] = '4';
  result[19] = hexDigits.slice((result[19].charCodeAt(0) & 0x3) | 0x8, 1);
  result[8] = result[13] = result[18] = result[23] = '-';

  return result.join('');
}

/**
 * Upravi prvni pismeno retezce na velke
 */
export function ucfirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Zaloguje chybovou zpravu
 */
export function logException(name: string, error: unknown): void {
  if (isObject<string>(error) && ('message' in error)) {
    console.error(`${name}: ${error['message']}`);
  } else if (isString(error)) {
    console.error(`${name}: ${error}`);
  } else {
    console.error(`${name}:`, error);
  }
}

/**
 * Vrati nahodne cele cislo v danem intervalu
 */
export function random(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Oescapuje retezec pro regularni vyraz
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?${}()|[\]\\]/g, '\\$&'); // $& znamena cely odpovidajici retezec
}

/**
 * Seznam jednorazovych upozorneni
 */
const ONETIME_WARNS: string[] = [];

/**
 * Vypise jednorazove upozorneni do konzole
 */
export function warnOnetime(str: string): void {
  if (!ONETIME_WARNS.includes(str)) {
    ONETIME_WARNS.push(str);
    console.warn(str);
  }
}

/**
 * Debugovaci funkce
 */
export function $dbg(...data: any[]): void {
  if (environment.production) {
    return;
  }
  if (undefined === ($dbg as any).counter) {
    ($dbg as any).counter = 0;
    ($dbg as any).stamp = Date.now();
  }
  console.log(
    `%c${$dbg.name} ${++($dbg as any).counter}: %c${Date.now() - ($dbg as any).stamp}ms`,
    'color: #7bf;',
    'color: #bf7;',
    ...data
  );
}
