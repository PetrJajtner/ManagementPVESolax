/**
 * Seznam cest k modulum aplikace
 *
 * @author     Ing. Petr Jajtner <petr@jajtnerovi.cz>
 * @copyright  Ing. Petr Jajtner 2024
 */

/**
 * Typ pro cenu OTE
 */
export type PriceType = {

  /**
   * Priznak nabijeni v dane hodine
   * POZOR! Parser dennich cen zahazuje tuto informaci!
   */
  Charge?: boolean;

  /**
   * Cena v Kc za MWh
   */
  Price: number;

  /**
   * Priznak "chytreho" nabijeni
   */
  SmartCharge?: boolean;

  /**
   * Cas po ctvrthodinach
   * POZOR NA DNY SE ZMENOU CASU!
   */
  Time: string;
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
};
