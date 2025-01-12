/**
 * Seznam cest k modulum aplikace
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2024 - nyni
 */

/**
 * Typ pro cenu OTE
 */
export type PriceType = {

  /**
   * Priznak povoleni pretoku do site
   */
  Allow: boolean;

  /**
   * Hodina 0 - 23
   *
   * POZOR NA DNY SE ZMENOU CASU!
   *  * Std -> lt: 0, 1, 3, ...
   *  * Lt -> std: 0, 1, 2, 2, 3...
   */
  Hour: number;

  /**
   * Cena v Kc za MWh
   */
  Price: number;
};

/**
 * Typ pro ceny OTE
 */
export type PricesType = {

  /**
   * Cenovy prumer
   */
  Average?: number;

  /**
   * Ceny v dane hodine
   */
  Data?: PriceType[];

  /**
   * Datum, pro ktere plati ceny OTE
   */
  Date?: string;

  /**
   * Chyba pri zjistovani cen
   */
  Error?: string;

  /**
   * Pouzity cenovy prah
   */
  Threshold?: number;
};
