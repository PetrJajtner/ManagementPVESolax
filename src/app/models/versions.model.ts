/**
 * Typy pro verze stridace
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2024 - nyni
 */

/**
 * Verze stridace
 */
export type InverterVersionsType = {
  ArmVersion?:         string;
  FirmwareVersion?:    string;
  InvSerialNumber?:    string;
  MainDSPVersion?:     string;
  RegistrationNumber?: string;
  SlaveDSPVersion?:    string;
};
