<?php

/**
 * Soubor se tridou stridace
 */
const CLASS_INVERTER = __DIR__.'/inverters/solax.php';

/**
 * MIME typ obsahu pro JSON
 */
const CONTENT_JSON_TYPE = 'Content-type: application/json; charset="UTF-8"';

/**
 * Pocet desetinnych mist
 */
const DECIMAL_PLACES = 2;

/**
 * Soubor JSON s hodnotou udrzovaneho vykonu
 */
const FILE_BIAS = __DIR__.'/data/bias.json';

/**
 * Soubor JSON s nejnizsi cenou pro nabijeni
 */
const FILE_CHARGE = __DIR__.'/data/charge.json';

/**
 * Soubor pro sdilenou pamet
 */
const FILE_IPC = __DIR__.'/data/sensors.ipc';

/**
 * Textovy vystup s informacemi o zmenach
 */
const FILE_OUTPUT = __DIR__.'/data/output.txt';

/**
 * Soubor JSON se zitrejsimi cenami OTE
 */
const FILE_PREDICTION = __DIR__.'/data/prediction.json';

/**
 * Soubor JSON s dnesnimi cenami OTE
 */
const FILE_PRICES = __DIR__.'/data/prices.json';

/**
 * Soubor JSON s nastavenim rizeni
 */
const FILE_SETTINGS = __DIR__.'/data/settings.json';

/**
 * Chyba 400
 */
const HTTP_400 = 'HTTP/1.1 400 Bad Request';

/**
 * Chyba 500
 */
const HTTP_500 = 'HTTP/1.1 500 Internal Server Error';

/**
 * Prahova teplota stridace v °C
 */
const INVERTER_TEMPERATURE_THRESHOLD = 38;

/**
 * Klic pro data ve sdilene pameti - nabijeni
 */
const SHARED_MEMORY_KEY_CHARGE = 2;

/**
 * Klic pro data ve sdilene pameti - senzory
 */
const SHARED_MEMORY_KEY_SENSORS = 1;

/**
 * Pocet ponechanych zazanmu vystupu
 */
const MIN_OUTPUT_LINES = 15;

/**
 * Vstup PHP
 */
const PHP_INPUT = 'php://input';

/**
 * Casove pasmo
 */
const TIMEZONE = 'Europe/Prague';

/**
 * Priznak zobrazeni hodnot na dipleji
 */
const SHOW_ON_READ = false;

/**
 * Nastavi casovou zonu
 */
date_default_timezone_set(TIMEZONE);

/**
 * Nastavi limit zpracovani
 */
set_time_limit(900); // 15 min.

if (!function_exists('toJSON')) {

  /**
   * Zakoduje data do JSON a zformatuje vysledny retezec
   */
  function toJSON($data, $flags = JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) {
    return str_replace('    ', '  ', json_encode($data, $flags)).PHP_EOL;
  }
}

if (!function_exists('echoJSON')) {

  /**
   * Vypise data jako JSON do standardniho vystupu
   */
  function echoJSON($data, $exit = true) {
    header(CONTENT_JSON_TYPE);
    echo toJSON($data);
    if ($exit) {
      exit;
    }
  }
}

if (!function_exists('getInterval')) {

  /**
   * Vrati interval dotazovani na teploty v sekundach
   */
  function getInterval($ePaper = false) {
    $hour = +date('H');
    if ($hour > 21 || $hour < 6) { // od 22:00 do 6:00
      return $ePaper ? 900 : 7200; // E-paper - 15 min.; Termo: 2 hod.
    }
    if ($hour < 10 || $hour > 17) { // od 6:00 do 10:00 nebo od 18:00 do 22:00
      return $ePaper ? 150 : 900; // E-paper - 2,5 min.; Termo: 15 min.
    }
    return $ePaper ? 30 : 150; // od 10:00 do 18:00: E-paper - 30s; Termo: 2,5 min.
  }
}

if (!function_exists('high8bits')) {

  /**
   * Vrati hodnotu horniho bajtu (bity 8-15)
   */
  function high8bits($value, $unsigned = true) {
    $result = intval($value / 256);
    if ($unsigned) {
      return $result;
    }
    return $result < 128 ? $result : $result - 256;
  }
}

if (!function_exists('low8bits')) {

  /**
   * Vrati hodnotu dolniho bajtu (bity 0-7)
   */
  function low8bits($value, $unsigned = true) {
    $result = $value % 256;
    if ($unsigned) {
      return $result;
    }
    return $result < 128 ? $result : $result - 256;
  }
}

if (!function_exists('readJSON')) {

  /**
   * Nacte soubor JSON a vrati jej jako asociativni pole
   */
  function readJSON($filename, $defaultJSON = '{}') {
    return json_decode(file_get_contents($filename) ?: $defaultJSON, true);
  }
}

if (!function_exists('saveJSON')) {

  /**
   * Ulozi data do souboru JSON
   */
  function saveJSON($filename, $data, $flags = 0) {
    return file_put_contents($filename, toJSON($data), $flags);
  }
}

if (!function_exists('setSSEHeaders')) {

  /**
   * Nastavi PHP a HTTP hlavicky pro SSE
   */
  function setSSEHeaders() {
    ini_set('output_buffering', 'off');
    ob_implicit_flush(true);

    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');
    header('Access-Control-Allow-Origin: *');
  }
}

if (!class_exists('AccumulationData')) {

  /**
   * Trida pro ukladani zmeny akumulacnich dat
   */
  class AccumulationData {

    /**
     * Soubor pro vypis dat
     */
    private const FILE = __DIR__.'/data/sensors.txt';

    /**
     * Dotazovany klic akumulatoru
     */
    private const KEY = 'YieldToday';

    /**
     * Klic pro verifikaci akumulatoru
     */
    private const VERIFY_KEY = 'YieldTotal';

    /**
     * Posledni znama hodnota akumulatoru
     */
    private static float $__LastAccumulator = -1.0;

    /**
     * Overi vynulovani akumulatoru
     */
    public static function Check(array $data) {
      if (!isset($data[self::KEY]['value']) || !is_numeric($data[self::KEY]['value']))  {
        return;
      }

      $accumulator = (float) +$data[self::KEY]['value'];
      if (self::$__LastAccumulator < $accumulator) {
        self::$__LastAccumulator = $accumulator;
        return;
      }
      if (self::$__LastAccumulator > 0.0 && $accumulator < self::$__LastAccumulator) {
        if ((0 === (int) $accumulator) && ((int) $accumulator === (int) +$data[self::VERIFY_KEY]['value'])) {
          return; // kdyz dojde ke kratkemu vypadku dat
        }

        $last = self::$__LastAccumulator;
        file_put_contents(self::FILE, date('[c]')." Posledni hodnota: {$last}, nova: {$accumulator}.".PHP_EOL, FILE_APPEND | LOCK_EX);

        self::$__LastAccumulator = -1.0;
      }
    }

  }
}

if (!class_exists('Bias')) {

  /**
   * Trida pro ukladani hodnot BIAS
   */
  class Bias {

    /**
     * Vrati nebo nastavi aktualni hodnotu rezimu
     */
    public static function Mode($value = '__getter') {
      $data = self::__Load();

      if ((null === $value) || (is_numeric($value) && null === $data['mode'])) {
        $data['mode'] = null === $value ? null : +$value;
        self::__Save($data);
      }

      return $data['mode'];
    }

    /**
     * Vrati nebo nastavi aktualni hodnotu vykonu
     */
    public static function Power($value = '__getter') {
      $data = self::__Load();

      if ((null === $value) || (is_numeric($value) && null === $data['power'])) {
        $data['power'] = null === $value ? null : +$value;
        self::__Save($data);
      }

      return $data['power'];
    }

    /**
     * Nacte data ze souboru
     */
    private static function __Load() {
      if (!file_exists(FILE_BIAS)) {
        return ['mode' => null, 'power' => null];
      }

      $decoded = readJSON(FILE_BIAS);
      return [
        'mode'  => isset($decoded['mode']) ? +$decoded['mode'] : null,
        'power' => isset($decoded['power']) ? +$decoded['power'] : null
      ];
    }

    /**
     * Ulozi dana data do souboru
     */
    private static function __Save($data) {
      saveJSON(FILE_BIAS, $data);
    }

  }
}

if (!class_exists('SensorsSM')) {

  /**
   * Trida pro ukladani nebo cteni dat senzoru do/z sdilene pameti
   */
  class SensorsSM {

    /**
     * Semafor
     */
    private static $__sem = null;

    /**
     * Segment sdilena pameti
     */
    private static $__shm = null;

    /**
     * Ukonci praci se sdilenou pameti
     */
    public static function Done() {
      if (null !== self::$__shm) {
        shm_detach(self::$__shm);
      }

      self::$__sem = null;
      self::$__shm = null;
    }

    /**
     * Zahaji praci se sdilenou pameti
     */
    public static function Init() {
      if (null !== self::$__sem && null !== self::$__shm) {
        return true;
      }

      self::Done();

      $key = ftok(FILE_IPC, 'S');
      self::$__shm = shm_attach($key, 65536, 0666) ?: null;
      self::$__sem = sem_get($key, 1, 0666) ?: null;

      return (null !== self::$__sem && null !== self::$__shm);
    }

    /**
     * Vycte data ze sdilene pameti
     */
    public static function Read($key = 1) {
      if (null === self::$__sem || null === self::$__shm || !sem_acquire(self::$__sem)) {
        return null;
      }

      try {
        if (shm_has_var(self::$__shm, $key)) {
          return shm_get_var(self::$__shm, $key);
        }
      } finally {
        sem_release(self::$__sem);
      }

      return null;
    }

    /**
     * Zapise data do sdilene pameti
     */
    public static function Write($value, $key = 1) {
      if (null === self::$__sem || null === self::$__shm || !sem_acquire(self::$__sem)) {
        return false;
      }

      try {
        return shm_put_var(self::$__shm, $key, $value);
      } finally {
        sem_release(self::$__sem);
      }

      return false;
    }

  }
}
