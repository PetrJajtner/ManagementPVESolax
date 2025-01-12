<?php

require_once dirname(__DIR__).'/constants.php';

/**
 * Abstraktni trida pro tvorbu dalsich typu stridacu SolaX
 */
abstract class SolaXInverter {

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
   * Vrati textovy popis rezimu
   *
   * @param string $key    Klic rezimu
   * @param string $value  Ciselna hodnota rezimu
   * @return string        Textovy popis
   */
  abstract public function getMode($key, $value);

  /**
   * Na zaklade hodnot, predanych klicu a priznaku pridani jednotky vrati transformovane hodnoty
   *
   * @param array $values  Namerene hodnoty stridace
   * @param ?array $keys   Upravi vystup na pozadovane klice
   * @param ?bool $unit    Priznak pro vraceni jednotek, NULL pro oddeleni hodnoty a jednotky
   * @return array         Vraci pozadovana transformovana data stridace
   */
  abstract public function parse(array $values, array $keys = null, $unit = true);

  /**
   * Na zaklade informaci vrati verze stridace
   *
   * @param array $info  Informace o stridaci
   * @return array       Vraci verze stridace
   */
  abstract public function parseVersion(array $info);

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
    'KWH'     => 'kWh',
    'NONE'    => '',
    'PERCENT' => '%',
    'V'       => 'V',
    'W'       => 'W'
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
    14 => ['x3_hybrid_g4.php', 'X3HybridG4']
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
    $context = stream_context_create([
      'http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/json',
        'content' => "optType=ReadRealTimeData&pwd={$this->__dongleID}"
      ]
    ]);

    $response = false;
    for ($i = 0; $i < self::ATTEMPTS; ++$i) {
      $response = @file_get_contents($this->__location, false, $context);
      if ($response) {
        break;
      } else {
        sleep(5);
      }
    }

    $realData = json_decode($response, true);
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
    $context = stream_context_create([
      'http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/json',
        'content' => "optType=ReadRealTimeData&pwd={$this->__dongleID}"
      ]
    ]);

    $response = false;
    for ($i = 0; $i < self::ATTEMPTS; ++$i) {
      $response = @file_get_contents($this->__location, false, $context);
      if ($response) {
        break;
      } else {
        sleep(5);
      }
    }

    $realData = json_decode($response, true);
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
    $context = stream_context_create([
      'http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/json',
        'content' => "optType=ReadSetData&pwd={$this->__dongleID}"
      ]
    ]);

    $response = false;
    for ($i = 0; $i < self::ATTEMPTS; ++$i) {
      $response = @file_get_contents($this->__location, false, $context);
      if ($response) {
        break;
      } else {
        sleep(5);
      }
    }

    $setData = json_decode($response, true);
    if ($setData) {
      array_unshift($setData, 0); // indexovano od 1
      unset($setData[0]);
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

    $data = json_encode([
      'num' => 1,
      'Data' => [[
        'reg' => is_numeric($registryKey) ? $registryKey : self::REGISTRY[$registryKey][0],
        'val' => "{$converted}"
      ]]
    ]);
    $context = stream_context_create([
      'http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/json',
        'content' => "optType=setReg&pwd={$this->__dongleID}&data={$data}"
      ]
    ]);

    $response = false;
    for ($i = 0; $i < self::ATTEMPTS; ++$i) {
      $response = @file_get_contents($this->__location, false, $context);
      if ($response) {
        break;
      } else {
        sleep(5);
      }
    }

    if (false !== $response) {
      return -1 < stripos($response, 'success');
    }
    return false;
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
