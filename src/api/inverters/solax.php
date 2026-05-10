<?php

/**
 * Tridy pro zpracovani dat ze stridacu Solax
 *
 * @author     Ing. Petr Jajtner <petr@jajtnerovi.cz>
 * @copyright  Ing. Petr Jajtner 2024 - nyni
 */
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
  private const ATTEMPTS = 10;

  /**
   * Registry stridace - indexy posunuty o jeden tak, by zacinaly jednickou
   */
  private const REGISTRY = [
                         // [index(y) (!od jedne), prihlaseni?, jednotka, nasobek, prevod]
    'DateTime'           => [[25, 26, 27], true,  null,   null, '_getDateTime'], // Datum a cas stridace
    'WorkingMode'        => [          28, false, 'NONE',    1],                 // Pracovni rezim
    'WorkingModeText'    => [          28, false, 'NONE',    1, '_workingMode'], // Pracovni rezim textove
    'SelfUseMinSoC'      => [          29, true,  'PERCENT', 1],                 // Min. SOC v rezimu vlastni spotreby
    'ManualModeCharging' => [          36, false, 'NONE',    1],                 // Nucene nabijeni/vybijeni v manualnim rezimu
    'ExportControl'      => [          48, true,  'W',      10],                 // Rizeni exportu
    'BiasMode'           => [         190, true,  'NONE',    1],                 // Ovlivneni pretoku
    'BiasModeText'       => [         190, true,  'NONE',    1, '_biasMode'],    // Ovlivneni pretoku textove
    'BiasPower'          => [         250, true,  'W',       1],                 // Vykon udrzovaciho pretoku
  ];

  /**
   * Nastavovaci klice registru
   */
  private const REGISTRY_SET = [
               // [optType,  [parametry => callback]]
    'DateTime' => ['setRTC', ['YMDHMS' => '_setDateTime']]
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
      return $this->__cache[$cacheKey][$key] ?? null;
    }

    $this->__cache[$cacheKey] = $this->readRealData(null, $unit);
    return $this->__cache[$cacheKey][$key] ?? null;
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
    if (!$force && array_key_exists($cacheKey, $this->__cache) && array_key_exists($key, $this->__cache[$cacheKey])) {
      return $this->__cache[$cacheKey][$key];
    }

    $this->__cache[$cacheKey] = $this->readSetData(null, $unit);
    return $this->__cache[$cacheKey][$key] ?? null;
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
      if ($response && false !== strpos($response, '"type":') && false !== strpos($response, '"Data":[')) {
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
      if ($response && preg_match('/^\[-?\d+(,-?\d+)*\]$/', $response)) {
        break;
      } else {
        sleep(5);
      }
    }

    $setData = json_decode($response, true);
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

      $value = is_array($registry[0]) ? array_map(function($index) use ($setData) { return $setData[$index]; }, $registry[0]) : $setData[$registry[0]]; // Index 0 => registracni index
      if (!isset($value)) {
        $value = null;
      }
      if (isset($registry[3]) && is_numeric($value)) { // Index 3 => nasobek
        $value *= $registry[3];
      }
      if (isset($registry[4])) { // Index 4 => konverzni funkce
        $value = $this->{$registry[4]}($value);
      }
      if ($unit && isset($registry[2]) && array_key_exists($registry[2], self::UNITS)) { // Index 2 => jednotka
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
      if ($response && false !== strpos($response, '"sn":') && false !== strpos($response, '"ver":')) {
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
   * Nastavi hodnotu registru
   */
  public function setRegistryValue($registryKey, $value) {
    if (isset(self::REGISTRY[$registryKey]) && self::REGISTRY[$registryKey][1]) { // Index 1 => vyzadovano "prihlaseni"
      $this->setRegistryValue(0, '2014');
    }

    $converted = $value;
    if (isset(self::REGISTRY[$registryKey][3]) && is_numeric($value)) { // Index 3 => delitel
      $multiplier = self::REGISTRY[$registryKey][3] ? 1 / self::REGISTRY[$registryKey][3] : 1;
      $converted *= $multiplier;
    }

    $optType = 'setReg';
    $data = json_encode([
      'num' => 1,
      'Data' => [[
        'reg' => is_numeric($registryKey) ? $registryKey : self::REGISTRY[$registryKey][0],
        'val' => "{$converted}"
      ]]
    ]);

    if (isset(self::REGISTRY_SET[$registryKey]) && is_array(self::REGISTRY_SET[$registryKey])) {
      $result = [];
      if (isset(self::REGISTRY_SET[$registryKey][1]) && is_array(self::REGISTRY_SET[$registryKey][1])) {
        foreach (self::REGISTRY_SET[$registryKey][1] as $param => $clb) { // Index 1 => parametry a modifikatory
          $result[$param] = $this->{$clb}($value);
        }
      }

      $optType = self::REGISTRY_SET[$registryKey][0]; // Index 0 => optType
      $data = json_encode($result);
    }

    $context = stream_context_create([
      'http' => [
        'method'  => 'POST',
        'header'  => 'Content-Type: application/json',
        'content' => "optType={$optType}&pwd={$this->__dongleID}&data={$data}"
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
   * Vrati datum a cas RTC stridace ve formatu JSON
   */
  protected function _getDateTime($value) {
    if (!is_array($value) || 3 !== count($value)) {
      return null;
    }

    [$minsec, $dayhour, $yearmonth] = $value; // povinne poradi od nejnizsiho indexu
    $second = low8bits($minsec);
    $minute = high8bits($minsec);
    $hour = low8bits($dayhour);
    $day = high8bits($dayhour);
    $month = low8bits($yearmonth);
    $year = 2000 + high8bits($yearmonth);

    return date('c', mktime($hour, $minute, $second, $month, $day, $year));
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
   * Prevede datum ve formatu ISO 8601 na parametr URL
   */
  protected function _setDateTime($value) {
    $dt = new DateTime($value, new DateTimeZone(TIMEZONE));
    if ('now' === $value) {
      $secs = 59 - +$dt->format('s');
      (1 < $secs) && sleep($secs - 1);
      $dt->modify('+'.($secs + 2).' seconds');
    }

    return [
      +$dt->format('Y') - 2000,
      +$dt->format('m'),
      +$dt->format('d'),
      +$dt->format('H'),
      +$dt->format('i')
      // Sekundy se do stridace nepropisuji, berou se jako "00"
    ];
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
