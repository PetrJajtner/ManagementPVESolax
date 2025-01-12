<?php

require_once __DIR__.'/solax.php';

/**
 * Trida pro zpracovani dat senzoru SolaX X3 Hybrid G4
 */
class X3HybridG4 extends SolaXInverter {

  /**
   * Rezimy akumulatoru
   */
  public const BATTERY_MODES = [
    0 => 'BatteryModeSelfUse',       // Rezim vlastni spotreby
    1 => 'BatteryModeForceTimeUse',  // Manualni rezim
    2 => 'BatteryModeBackUp',        // Rezim zalohy
    3 => 'BatteryModeFeedinPriority' // Priorita dodavky do site'
  ];

  /**
   * Behove rezimy stridace
   */
  public const RUN_MODES = [
     0 => 'RunModeWaiting',        // Cekani
     1 => 'RunModeChecking',       // Kontrola
     2 => 'RunModeNormal',         // Normalni provoz
     3 => 'RunModeFault',          // Porucha
     4 => 'RunModePermanentFault', // Trvala porucha
     5 => 'RunModeUpdating',       // Aktualizace
     6 => 'RunModeEPSCheck',       // Kontrola EPS
     7 => 'RunModeEPS',            // Rezim EPS
     8 => 'RunModeSelfTest',       // Autotest
     9 => 'RunModeIdle',           // Rezim necinnosti
    10 => 'RunModeStandby'         // Pohotovostni rezim
  ];

  /**
   * Senzory stridace
   */
  private const SENSORS = [
                                  // [index, jednotka, prevod]
    'Grid1Voltage'                => [0, 'V', '_div10'],
    'Grid2Voltage'                => [1, 'V', '_div10'],
    'Grid3Voltage'                => [2, 'V', '_div10'],
    'Grid1Current'                => [3, 'A', '_toSignedDiv10'],
    'Grid2Current'                => [4, 'A', '_toSignedDiv10'],
    'Grid3Current'                => [5, 'A', '_toSignedDiv10'],
    'Grid1Power'                  => [6, 'W', '_toSigned'],
    'Grid2Power'                  => [7, 'W', '_toSigned'],
    'Grid3Power'                  => [8, 'W', '_toSigned'],
    'PV1Voltage'                  => [10, 'V', '_div10'],
    'PV2Voltage'                  => [11, 'V', '_div10'],
    'PV1Current'                  => [12, 'A', '_div10'],
    'PV2Current'                  => [13, 'A', '_div10'],
    'PV1Power'                    => [14, 'W'],
    'PV2Power'                    => [15, 'W'],
    'Grid1Frequency'              => [16, 'HZ', '_div100'],
    'Grid2Frequency'              => [17, 'HZ', '_div100'],
    'Grid3Frequency'              => [18, 'HZ', '_div100'],
    'RunMode'                     => [19, 'NONE'],
    'RunModeText'                 => [19, 'NONE', '_runMode'],
    'EPS1Voltage'                 => [23, 'V', '_div10'],
    'EPS2Voltage'                 => [24, 'V', '_div10'],
    'EPS3Voltage'                 => [25, 'V', '_div10'],
    'EPS1Current'                 => [26, 'A', '_toSignedDiv10'],
    'EPS2Current'                 => [27, 'A', '_toSignedDiv10'],
    'EPS3Current'                 => [28, 'A', '_toSignedDiv10'],
    'EPS1Power'                   => [29, 'W', '_toSigned'],
    'EPS2Power'                   => [30, 'W', '_toSigned'],
    'EPS3Power'                   => [31, 'W', '_toSigned'],
    'GridPower'                   => [[34, 35], 'W', '_toSigned32'],
    'BatteryCurrent'              => [40, 'A', '_toSignedDiv100'],
    'BatteryPower'                => [41, 'W', '_toSigned'],
    'RadiatorTemperatureInner'    => [46, 'C', '_toSigned'],
    'LoadPower'                   => [47, 'W', '_toSigned'],
    'RadiatorTemperature'         => [54, 'C', '_toSigned'],
    'YieldTotal'                  => [[68, 69], 'KWH', '_div10'],
    'YieldToday'                  => [70, 'KWH', '_div10'],
    'BatteryDischargeEnergyTotal' => [[74, 75], 'KWH', '_div10'],
    'BatteryChargeEnergyTotal'    => [[76, 77], 'KWH', '_div10'],
    'BatteryDischargeEnergyToday' => [78, 'KWH', '_div10'],
    'BatteryChargeEnergyToday'    => [79, 'KWH', '_div10'],
    'PVEnergyTotal'               => [[80, 81], 'KWH', '_div10'],
    'EPSEnergyTotal'              => [[83, 84], 'KWH', '_div10'],
    'EPSEnergyToday'              => [85, 'KWH', '_div10'],
    'FeedInEnergyTotal'           => [[86, 87], 'KWH', '_div100'],
    'ConsumedEnergyTotal'         => [[88, 89], 'KWH', '_div100'],
    'FeedInEnergyToday'           => [[90, 91], 'KWH', '_div100'],
    'ConsumedEnergyToday'         => [[92, 93], 'KWH', '_div100'],
    'BatteryRemainingCapacity'    => [103, 'PERCENT'],
    'BatteryTemperature'          => [105, 'C', '_toSigned'],
    'BatteryRemainingEnergy'      => [106, 'KWH', '_div10'],
    'BatteryMode'                 => [168, 'NONE'],
    'BatteryModeText'             => [168, 'NONE', '_batteryMode'],
    'BatteryVoltage'              => [[169, 170], 'V', '_div100']
  ];

  /**
   * Vrati hodnoty klicu poli
   */
  public function __get($name) {
    if (in_array($name, self::BATTERY_MODES)) {
      return array_search($name, self::BATTERY_MODES);
    }
    if (in_array($name, self::RUN_MODES)) {
      return array_search($name, self::RUN_MODES);
    }
    return null;
  }

  /**
   * Vrati textovy popis rezimu
   *
   * @param string $key    Klic rezimu
   * @param string $value  Ciselna hodnota rezimu
   * @return string        Textovy popis
   */
  public function getMode($key, $value) {
    if ('BatteryMode' === $key) {
      return $this->_batteryMode($value);
    }
    if ('RunMode' === $key) {
      return $this->_runMode($value);
    }
    return 'Unknown';
  }

  /**
   * Na zaklade dat, predanych klicu a priznaku pridani jednotky vrati transformovane hodnoty
   *
   * @param array $data   Namerena data stridace
   * @param ?array $keys  Upravi vystup na pozadovane klice
   * @param ?bool $unit   Priznak pro vraceni jednotek, NULL pro oddeleni hodnoty a jednotky
   * @return array        Vraci pozadovana transformovana data stridace
   */
  public function parse(array $data, array $keys = null, $unit = true) {
    $result = [];
    if (!isset($keys) || (is_array($keys) && 0 === count($keys))) {
      $keys = array_keys(self::SENSORS);
    }

    foreach ($keys as $key) {
      if (!array_key_exists($key, self::SENSORS) || !isset(self::SENSORS[$key])) {
        continue;
      }

      $value = 0;
      $manipulation = self::SENSORS[$key];
      if (is_numeric($manipulation[0])) {
        $value = $data[$manipulation[0]];
      }
      if (is_array($manipulation[0])) {
        $values = array();
        foreach ($manipulation[0] as $index => $sensorKey) {
          $values[$index] = $data[$sensorKey];
        }
        $value = $this->_packU16(...$values);
      }
      if (isset($manipulation[2])) {
        $value = $this->{$manipulation[2]}($value);
      }
      if ($unit && isset($manipulation[1]) && array_key_exists($manipulation[1], SolaX::UNITS)) {
        $value .= SolaX::UNITS[$manipulation[1]];
      }
      if (null === $unit) {
        $u = isset(SolaX::UNITS[$manipulation[1]]) && SolaX::UNITS[$manipulation[1]] ? SolaX::UNITS[$manipulation[1]] : null;
        $v = is_numeric($value) ? round($value, self::DECIMAL_PLACES) : $value;
        $value = ['value' => $v, 'unit' => $u];
      }
      $result[$key] = $value;
    }

    return $result;
  }

  /**
   * Na zaklade informaci vrati verze stridace
   *
   * @param array $info  Informace o stridaci
   * @return array       Vraci verze stridace
   */
  public function parseVersion(array $info) {
    return [
      'InvSerialNumber' => "{$info[2]}",
      'ArmVersion'      => implode('–', [
        $this->__fixVersionNumber("{$info[6]}"),
        $this->__fixVersionNumber("{$info[7]}"),
      ]),
      'MainDSPVersion'  => $this->__fixVersionNumber("{$info[4]}"),
      'SlaveDSPVersion' => $this->__fixVersionNumber("{$info[5]}")
    ];
  }

  /**
   * Vrati textovy popis rezimu akumulatoru
   *
   * @param int $value
   * @return string
   */
  protected function _batteryMode($value) {
    return array_key_exists($value, self::BATTERY_MODES)
            ? self::BATTERY_MODES[$value]
            : 'BatteryModeUnknown';
  }

  /**
   * Vrati textovy popis rezimu stridace
   *
   * @param int $value
   * @return string
   */
  protected function _runMode($value) {
    return array_key_exists($value, self::RUN_MODES)
            ? self::RUN_MODES[$value]
            : 'RunModeUnknown';
  }

  /**
   * Upravi cislo verze na X.YY
   *
   * @param string $value
   * @return string
   */
  private function __fixVersionNumber($value) {
    $parts = array_pad(explode('.', $value, 2), 2, '0');
    $parts[1] = str_pad($parts[1], 2, '0');
    return "{$parts[0]}.{$parts[1]}";
  }

}
