<?php

/**
 * Tridy maket (testovacích objektů) pro zpracovani dat ze stridacu Solax
 *
 * @author     Ing. Petr Jajtner <info@petrjajtner.cz>
 * @copyright  Ing. Petr Jajtner 2024 - nyni
 */
require_once dirname(__DIR__).'/constants.php';

/**
 * Maketa tridy typu SolaX X3-Hybrid-G4
 */
class X3HybridG4 {

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
                                  // [     index,  jednotka, prevod]
    'Grid1Voltage'                => [         0,       'V', '_div10'],
    'Grid2Voltage'                => [         1,       'V', '_div10'],
    'Grid3Voltage'                => [         2,       'V', '_div10'],
    'Grid1Current'                => [         3,       'A', '_toSignedDiv10'],
    'Grid2Current'                => [         4,       'A', '_toSignedDiv10'],
    'Grid3Current'                => [         5,       'A', '_toSignedDiv10'],
    'Grid1Power'                  => [         6,       'W', '_toSigned'],
    'Grid2Power'                  => [         7,       'W', '_toSigned'],
    'Grid3Power'                  => [         8,       'W', '_toSigned'],
    'ACPowerTotal'                => [         9,       'W', '_toSigned'], // Soucet hodnot na indexu 6 + 7 + 8
    'PV1Voltage'                  => [        10,       'V', '_div10'],
    'PV2Voltage'                  => [        11,       'V', '_div10'],
    'PV1Current'                  => [        12,       'A', '_div10'],
    'PV2Current'                  => [        13,       'A', '_div10'],
    'PV1Power'                    => [        14,       'W'],
    'PV2Power'                    => [        15,       'W'],
    'Grid1Frequency'              => [        16,       'HZ', '_div100'],
    'Grid2Frequency'              => [        17,       'HZ', '_div100'],
    'Grid3Frequency'              => [        18,       'HZ', '_div100'],
    'RunMode'                     => [        19,     'NONE'],
    'RunModeText'                 => [        19,     'NONE', '_runMode'],
    'EPS1Voltage'                 => [        23,       'V', '_div10'],
    'EPS2Voltage'                 => [        24,       'V', '_div10'],
    'EPS3Voltage'                 => [        25,       'V', '_div10'],
    'EPS1Current'                 => [        26,       'A', '_toSignedDiv10'],
    'EPS2Current'                 => [        27,       'A', '_toSignedDiv10'],
    'EPS3Current'                 => [        28,       'A', '_toSignedDiv10'],
    'EPS1Power'                   => [        29,       'W', '_toSigned'],
    'EPS2Power'                   => [        30,       'W', '_toSigned'],
    'EPS3Power'                   => [        31,       'W', '_toSigned'],
    'GridPower'                   => [  [34, 35],       'W', '_toSigned32'],
    'BatteryCurrent'              => [        40,       'A', '_toSignedDiv100'],
    'BatteryPower'                => [        41,       'W', '_toSigned'],
    'BMSStatus'                   => [        45,    'NONE'],
    'RadiatorTemperatureInner'    => [        46,       'C', '_toSigned'],
    'LoadPower'                   => [        47,       'W', '_toSigned'],
    'RadiatorTemperature'         => [        54,       'C', '_toSigned'],
    'YieldTotal'                  => [  [68, 69],     'KWH', '_div10'],
    'YieldToday'                  => [        70,     'KWH', '_div10'], // Vcetne vykonu z akumulatoru
    'BatteryDischargeEnergyTotal' => [  [74, 75],     'KWH', '_div10'],
    'BatteryChargeEnergyTotal'    => [  [76, 77],     'KWH', '_div10'],
    'BatteryDischargeEnergyToday' => [        78,     'KWH', '_div10'],
    'BatteryChargeEnergyToday'    => [        79,     'KWH', '_div10'],
    'PVEnergyTotal'               => [  [80, 81],     'KWH', '_div10'],
    'PVETodayYield'               => [        82,     'KWH', '_div10'], // Vykon z panelu
    'EPSEnergyTotal'              => [  [83, 84],     'KWH', '_div10'],
    'EPSEnergyToday'              => [        85,     'KWH', '_div10'],
    'FeedInEnergyTotal'           => [  [86, 87],     'KWH', '_div100'],
    'ConsumedEnergyTotal'         => [  [88, 89],     'KWH', '_div100'],
    'FeedInEnergyToday'           => [  [90, 91],     'KWH', '_div100'],
    'ConsumedEnergyToday'         => [  [92, 93],     'KWH', '_div100'],
    'BatteryRemainingCapacity'    => [       103, 'PERCENT'],
    'BatteryTemperature'          => [       105,       'C', '_toSigned'],
    'BatteryRemainingEnergy'      => [       106,     'KWH', '_div10'],
    'BatteryMode'                 => [       168,    'NONE'],
    'BatteryModeText'             => [       168,    'NONE', '_batteryMode'],
    'BatteryVoltage'              => [[169, 170],       'V', '_div100']
  ];

  /**
   * Pocet desetinnych mist
   */
  protected const DECIMAL_PLACES = DECIMAL_PLACES;

  /**
   * Max. velikost celeho 16bit cisla
   */
  protected const INT16_MAX = 0x7FFF;

  /**
   * Max. velikost celeho 32bit cisla
   */
  protected const INT32_MAX = 0x7FFFFFFF;

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
      if (is_numeric($manipulation[0]) && array_key_exists($manipulation[0], $data)) {
        $value = $data[$manipulation[0]];
      }
      if (is_array($manipulation[0])) {
        $values = array();
        foreach ($manipulation[0] as $index => $sensorKey) {
          $values[$index] = array_key_exists($sensorKey, $data) ? $data[$sensorKey] : 0;
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
      'NominalInvPower' => ['value' => $info[0], 'unit' => 'kW'],
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
   * Vydeli cislo 10
   *
   * @param int $value
   * @return int
   */
  protected function _div10($value) {
    return $value * 0.1;
  }

  /**
   * Vydeli cislo 100
   *
   * @param int $value
   * @return int
   */
  protected function _div100($value) {
    return $value * 0.01;
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

  /**
   * Rozbali (typicky) dva registry na cele kladne 16bit cislo
   *
   * @param int $value
   * @return int
   */
  protected function _packU16(...$values) {
    $result = 0.0;
    $shift = 1;
    foreach ($values as $value) {
      $result += $value * $shift;
      $shift *= 2 ** 16;
    }
    return $result;
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
   * Prevede cislo na znamenkove 16bit
   *
   * @param int $value
   * @return int
   */
  protected function _toSigned($value) {
    if ($value > self::INT16_MAX) {
      $value -= 2 ** 16;
    }
    return $value;
  }

  /**
   * Prevede cislo na znamenkove 32bit
   *
   * @param int $value
   * @return int
   */
  protected function _toSigned32($value) {
    if ($value > self::INT32_MAX) {
      $value -= 2 ** 32;
    }
    return $value;
  }

  /**
   * Prevede cislo na znamenkove a vydeli 10
   *
   * @param int $value
   * @return int
   */
  protected function _toSignedDiv10($value) {
    return $this->_div10($this->_toSigned($value));
  }

  /**
   * Prevede cislo na znamenkove a vydeli 100
   *
   * @param int $value
   * @return int
   */
  protected function _toSignedDiv100($value) {
    return $this->_div100($this->_toSigned($value));
  }

}

/**
 * Trida pro zpracovani dat senzoru SolaX - obecne
 */
class SolaX {

  /**
   * Rezimy ovlivneni pretoku
   */
  public const BIAS_MODES = [
    0 => 'BiasModeDisabled', // Ovlivneni zakazano
    1 => 'BiasModeGrid',     // Ovlivneni smerem do site
    2 => 'BiasModeINV',      // Ovlivneni smerem ze site
  ];

  /**
   * Rezimy nuceneho nabijeni/vybijeni v manualnim rezimu
   */
  public const MANUAL_MODES = [
    0 => 'ManualModeChargingOff',    // Nucene nabijeni/vybijeni vypnuto
    1 => 'ManualModeForceCharge',    // Nucene nabijeni
    2 => 'ManualModeForceDischarge', // Nucene vybijeni
  ];

  /**
   * Jednotky
   */
  public const UNITS = [
    'A'       => 'A',
    'C'       => '°C',
    'HZ'      => 'Hz',
    'KW'      => 'kW',
    'KWH'     => 'kWh',
    'NONE'    => '',
    'PERCENT' => '%',
    'V'       => 'V',
    'W'       => 'W',
    'WH'      => 'Wh'
  ];

  /**
   * Behove rezimy stridace
   */
  public const WORKING_MODES = [
    0 => 'WorkingModeSelfUse', // Vlastni spotreba
    1 => 'WorkingModeFeedIn',  // Priorita pretoku do verejne distribucni site
    2 => 'WorkingModeBackup',  // Rezim zalohy
    3 => 'WorkingModeManual'   // Manual
  ];

  /**
   * Pocet pokusu o pripojeni na SolaX
   */
  private const ATTEMPTS = 3;

  /**
   * Registry stridace
   */
  private const REGISTRY = [
                         // [index (!od jedne), prihlaseni?, jednotka, nasobek, prevod]
    'WorkingMode'        => [ 28, false, 'NONE',    1],                 // Pracovni rezim
    'WorkingModeText'    => [ 28, false, 'NONE',    1, '_workingMode'], // Pracovni rezim textove
    'SelfUseMinSoC'      => [ 29, true,  'PERCENT', 1],                 // Min. SOC v rezimu vlastni spotreby
    'ManualModeCharging' => [ 36, false, 'NONE',    1],                 // Nucene nabijeni/vybijeni v manualnim rezimu
    'ExportControl'      => [ 48, true,  'W',      10],                 // Rizeni exportu
    'BiasMode'           => [190, true,  'NONE',    1],                 // Ovlivneni pretoku
    'BiasModeText'       => [190, true,  'NONE',    1, '_biasMode'],    // Ovlivneni pretoku textove
    'BiasPower'          => [250, true,  'W',       1],                 // Vykon ovlivnenych pretoku
  ];

  /**
   * Typy stridacu
   */
  private const TYPES = [
    14 => ['mock-up.php', 'X3HybridG4']
  ];

  /**
   * Jednoducha cache
   */
  private $__cache = [];

  /**
   * Identifikator zarizeni v siti
   *
   * @var string
   */
  private $__dongleID = 'S_________';

  /**
   * Instance modelu stridace
   *
   * @var SolaXInverter
   */
  private $__inverter = null;

  /**
   * Umisteni v siti
   *
   * @var string
   */
  private $__location = 'http://1.2.3.4';

  /**
   * Konstruktor - nastaveni stridace
   *
   * @param array $config
   */
  public function __construct(array $config) {
    if (is_array($config)) {
      $keys = [
        'DongleID' => '__dongleID',
        'Location' => '__location'
      ];
      foreach ($keys as $key => $member) {
        if (array_key_exists($key, $config) && isset($config[$key])) {
          $this->{$member} = $config[$key];
        }
      }
    }
  }

  /**
   * Vrati hodnoty klicu poli
   */
  public function __get($name) {
    if (in_array($name, self::BIAS_MODES)) {
      return array_search($name, self::BIAS_MODES);
    }
    if (in_array($name, self::MANUAL_MODES)) {
      return array_search($name, self::MANUAL_MODES);
    }
    if (in_array($name, self::WORKING_MODES)) {
      return array_search($name, self::WORKING_MODES);
    }
    if (null !== $this->__inverter) {
      return $this->__inverter->{$name};
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
    if ('BiasMode' === $key) {
      return $this->_biasMode($value);
    }
    if ('ManualModeCharging' === $key) {
      return $this->_manualMode($value);
    }
    if ('WorkingMode' === $key) {
      return $this->_workingMode($value);
    }
    if (null !== $this->__inverter) {
      return $this->__inverter->getMode($key, $value);
    }
    return 'Unknown';
  }

  /**
   * Vrati aktualni hodnotu konkretniho senzoru ze SolaX
   *
   * @param string $key   Nazev senzoru
   * @param ?bool $unit   Priznak pro vraceni jednotky, NULL pro oddeleni hodnoty a jednotky
   * @param ?bool $force  Priznak pro vynuceni nacteni dat bez cache
   * @return mixed        Vraci pozadovanou transformovanou hodnotu senzoru stridace
   */
  public function getRealValue($key, $unit = true, $force = false) {
    $cacheKey = json_encode(['method' => __METHOD__, 'unit' => $unit]);
    if (!$force && array_key_exists($cacheKey, $this->__cache)) {
      return $this->__cache[$cacheKey][$key];
    }

    $this->__cache[$cacheKey] = $this->readRealData(null, $unit);
    return $this->__cache[$cacheKey][$key];
  }

  /**
   * Vrati aktualni hodnotu konkretniho registru ze SolaX
   *
   * @param string $key   Nazev registru
   * @param ?bool $unit   Priznak pro vraceni jednotky, NULL pro oddeleni hodnoty a jednotky
   * @param ?bool $force  Priznak pro vynuceni nacteni dat bez cache
   * @return mixed        Vraci pozadovanou transformovanou hodnotu registru stridace
   */
  public function getRegistryValue($key, $unit = true, $force = false) {
    $cacheKey = json_encode(['method' => __METHOD__, 'unit' => $unit]);
    if (!$force && array_key_exists($cacheKey, $this->__cache)) {
      return $this->__cache[$cacheKey][$key];
    }

    $this->__cache[$cacheKey] = $this->readSetData(null, $unit);
    return $this->__cache[$cacheKey][$key];
  }

  /**
   * Vrati verze stridace
   */
  public function readVersion() {
    $json = file_get_contents(__DIR__.'/mock-up.json');
    $data = json_decode($json, true);

    $realData = $data['readRealData'];
    if (!is_array($realData) || !array_key_exists('sn', $realData) ||
        !array_key_exists('ver', $realData) || !is_array($realData['Information'])) {
      return [];
    }

    $inverter = $this->__getInverter($realData['type']);
    return array_merge(
      $inverter->parseVersion($realData['Information']),
      [
        'RegistrationNumber' => $realData['sn'],
        'FirmwareVersion'    => $realData['ver']
      ]
    );
  }

  /**
   * Vrati aktualni data hodnot senzoru ze SolaX
   *
   * @param ?array $keys  Upravi vystup na pozadovane klice
   * @param ?bool $unit   Priznak pro vraceni jednotek, NULL pro oddeleni hodnoty a jednotky
   * @return array        Vraci pozadovana transformovana data stridace
   */
  public function readRealData(array $keys = null, $unit = true) {
    $json = file_get_contents(__DIR__.'/mock-up.json');
    $data = json_decode($json, true);

    $realData = $data['readRealData'];
    if (!is_array($realData) || !array_key_exists('type', $realData) ||
        !array_key_exists($realData['type'], self::TYPES) ||
        !array_key_exists('Data', $realData) || !is_array($realData['Data'])) {
      return [];
    }

    $inverter = $this->__getInverter($realData['type']);
    return $inverter->parse($realData['Data'], $keys, $unit);
  }

  /**
   * Vrati hodnotu registru
   *
   * @param ?array $keys  Upravi vystup na pozadovane klice
   * @param ?bool $unit   Priznak pro vraceni jednotek, NULL pro oddeleni hodnoty a jednotky
   * @return array        Vraci pozadovane transformovana data stridace
   */
  public function readSetData(array $keys = null, $unit = true) {
    $json = file_get_contents(__DIR__.'/mock-up.json');
    $data = json_decode($json, true);

    $setData = $data['readSetData'];
    if ($setData) {
      array_unshift($setData, -1); // posun pole, aby bylo indexovano od 1
    } else {
      return [];
    }

    if (!isset($keys) || (is_array($keys) && 0 === count($keys))) {
      $keys = array_keys(self::REGISTRY);
    }

    $result = [];
    foreach ($keys as $key) {
      if (!array_key_exists($key, self::REGISTRY) || !isset(self::REGISTRY[$key])) {
        continue;
      }

      $registry = self::REGISTRY[$key];

      $value = $setData[$registry[0]];
      if (!isset($value)) {
        $value = null;
      }
      if (isset($registry[3]) && is_numeric($value)) {
        $value *= $registry[3];
      }
      if (isset($registry[4])) {
        $value = $this->{$registry[4]}($value);
      }
      if ($unit && isset($registry[2]) && array_key_exists($registry[2], self::UNITS)) {
        $value .= self::UNITS[$registry[2]];
      }
      if (null === $unit) {
        $u = isset(self::UNITS[$registry[2]]) && self::UNITS[$registry[2]] ? self::UNITS[$registry[2]] : null;
        $value = ['value' => $value, 'unit' => $u];
      }
      $result[$key] = $value;
    }

    return $result;
  }

  /**
   * Nastavi hodnotu registru
   */
  public function setRegistryValue($registryKey, $value) {
    if (isset(self::REGISTRY[$registryKey]) && self::REGISTRY[$registryKey][1]) {
      $this->setRegistryValue(0, '2014'); // „Prihlaseni“
    }

    $converted = $value;
    if (isset(self::REGISTRY[$registryKey][3]) && is_numeric($value)) {
      $multiplier = self::REGISTRY[$registryKey][3] ? 1 / self::REGISTRY[$registryKey][3] : 1;
      $converted *= $multiplier;
    }

    $setDataKey = is_numeric($registryKey) ? $registryKey : self::REGISTRY[$registryKey][0];
    $setDataValue = +"{$converted}";

    $json = file_get_contents(__DIR__.'/mock-up.json');
    $data = json_decode($json);

    $setData = $data['readSetData'];
    array_unshift($setData, 0);

    $setData[$setDataKey] = $setDataValue;
    unset($setData[0]);

    $data['readSetData'] = $setData;
    $result = file_put_contents(__DIR__.'/mock-up.json', toJSON($data));

    return false !== $result;
  }

  /**
   * Vrati textovy popis ovlivneni pretoku stridace
   *
   * @param int $value
   * @return string
   */
  protected function _biasMode($value) {
    return array_key_exists($value, self::BIAS_MODES)
            ? self::BIAS_MODES[$value]
            : 'BiasModeUnknown';
  }

  /**
   * Vrati textovy popis manualniho rezimu
   *
   * @param int $value
   * @return string
   */
  protected function _manualMode($value) {
    return array_key_exists($value, self::MANUAL_MODES)
            ? self::MANUAL_MODES[$value]
            : 'ManualModeUnknown';
  }

  /**
   * Vrati textovy popis pracovniho rezimu stridace
   *
   * @param int $value
   * @return string
   */
  protected function _workingMode($value) {
    return array_key_exists($value, self::WORKING_MODES)
            ? self::WORKING_MODES[$value]
            : 'WorkingModeUnknown';
  }

  /**
   * Vrati instanci modelu stridace dle typu
   */
  private function __getInverter($type) {
    if (null === $this->__inverter) {
      $inverter = self::TYPES[$type];
      require_once __DIR__.'/'.$inverter[0];

      $this->__inverter = new $inverter[1]();
    }
    return $this->__inverter;
  }

}
