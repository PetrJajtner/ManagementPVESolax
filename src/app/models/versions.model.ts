/**
 * Typy pro verze stridace
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2024 - nyni
 */
import { Measurement } from '@app/models/pve.model';

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
