/**
 * Typy pro verze stridace
 *
 * @author     Ing. Petr Jajtner <petr@jajtnerovi.cz>
 * @copyright  Ing. Petr Jajtner 2024
 */
import { Measurement } from './pve.model';

/**
 * Verze stridace
 */
export type InverterVersionsType = {
  ArmVersion?:         string;
  FirmwareVersion?:    string;
  InvSerialNumber?:    string;
  MainDSPVersion?:     string;
  NominalInvPower?:    Measurement;
  RegistrationNumber?: string;
  SlaveDSPVersion?:    string;
};
