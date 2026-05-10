/**
 * Model pro upravu data
 *
 * @author     Ing. Petr Jajtner <petr@jajtnerovi.cz>
 * @copyright  Ing. Petr Jajtner 2026
 */

/**
 * Trida pro formatovani data
 */
export class DateUtils {

  /**
   * Zformatuje casovou znacku na localni ISO
   */
  public static LocalISO(value: string | number | Date, withSeconds = true, withZone = true): string {
    const
      date = new Date(value),
      tzo = -date.getTimezoneOffset(),
      mark = tzo >= 0 ? '+' : '-',

      year = date.getFullYear(),
      month = DateUtils.__Pad(date.getMonth() + 1),
      day = DateUtils.__Pad(date.getDate()),
      hours = DateUtils.__Pad(date.getHours()),
      minutes = DateUtils.__Pad(date.getMinutes()),
      seconds = DateUtils.__Pad(date.getSeconds()),
      tzHours = DateUtils.__Pad(Math.floor(Math.abs(tzo) / 60)),
      tzMins = DateUtils.__Pad(Math.abs(tzo) % 60)
    ;
    if (withSeconds && withZone) {
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${mark}${tzHours}:${tzMins}`;
    }
    return `${year}-${month}-${day}T${hours}:${minutes}` + (withSeconds ? `:${seconds}` : '');
  }

  /**
   * Doplni cislo na nuly
   */
  private static __Pad(value: number): string {
    return `${value}`.padStart(2, '0');
  }

}
