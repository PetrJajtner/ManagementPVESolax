<?php

require_once __DIR__.'/constants.php';

/**
 * Dnesni den
 */
define('TODAY', date('Y-m-d'));

/**
 * Trida pro vypocet cen OTE
 */
class PricesParser {

  /**
   * Mena Euro
   */
  private const CURRENCY = 'EUR';

  /**
   * Zastupny text pro datum
   */
  private const DATE = '%date%';

  /**
   * Zastupny text pro interval
   */
  private const INTERVAL = '%interval%';

  /**
   * URL dat pro kurz men
   */
  private $__currencyDataURL = 'https://data.kurzy.cz/json/meny/b[6]%date%.json';

  /**
   * Datum, pro ktere jsou vypocitavana data
   */
  private $__date = TODAY;

  /**
   * Kurz Eura ke Korune
   */
  private $__eurExchangeRate = 1.0;

  /**
   * URL dat cen OTE
   * report_date=[date]&time_resolution=[PT60M|PT15M]
   */
  private $__graphDataURL = 'https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/denni-trh/@@chart-data?report_date=%date%&time_resolution=%interval%';

  /**
   * Casove rozliseni
   */
  private $__granularities = [
    '60m',
    '15m'
  ];

  /**
   * Parametr intervalu prubehoveho mereni
   */
  private $__intervals = [
    'PT60M',
    'PT15M'
  ];

  /**
   * Index prubehoveno mereni
   */
  private $__metering = 0;

  /**
   * Priznak ukladani do souboru
   */
  private $__toFile = true;

  /**
   * Konstruktor
   */
  public function __construct() {
    $settings = readJSON(FILE_SETTINGS);
    $this->__metering = isset($settings['MeteringInterval']) ? +$settings['MeteringInterval'] : 0;

    if (isset($_REQUEST['json'])) {
      $this->__toFile = false;
    }

    if (isset($_REQUEST['date'])) {
      $this->__date = $_REQUEST['date'];
    }
    if (isset($_REQUEST['1'])) {
      $this->__date = date('Y-m-d', strtotime('+1 day'));
    }
    $this->__graphDataURL = str_replace([self::DATE, self::INTERVAL], [$this->__date, $this->__intervals[$this->__metering]], $this->__graphDataURL);

    $currencyDate = $this->__date < TODAY ? 'den['.date('Ymd', strtotime($this->__date)).']' : '';
    $this->__currencyDataURL = str_replace(self::DATE, $currencyDate, $this->__currencyDataURL);
  }

  /**
   * Hlavni behova metoda
   */
  public function run() {
    if (null === $this->__parseCurrency()) {
      return;
    }
    if (null === $this->__parseGraphData()) {
      return;
    }
  }

  /**
   * Vrati cenovy prumer
   */
  private function __priceAverage(array $data) {
    $sum = 0.0;
    $count = count($data);
    if (0 === $count) {
      return $sum;
    }
    foreach ($data as $item) {
      $sum += $item['Price'];
    }
    return round($sum / $count, DECIMAL_PLACES);
  }

  /**
   * Vrati obsah souboru
   */
  private function __getContents($url) {
    $context = stream_context_create([
      'ssl' => [
        'verify_peer'      => false,
        'verify_peer_name' => false
      ]
    ]);

    $data = @file_get_contents($url, false, $context);
    if (false === $data) {
      $this->__output(['error' => "No data for {$url}"]);
      return null;
    }

    $decoded = json_decode($data, true);
    if (null === $decoded) {
      $this->__output(['error' => "Decoding data failed for {$url}"]);
    }

    return $decoded;
  }

  /**
   * Vrati casovy posuv
   */
  private function __getDSTChange() {
    $currentDate = new DateTime("{$this->__date}T00:00:00", new DateTimeZone(TIMEZONE));
    $nextDate = (clone $currentDate)->modify('+1 day');
    return ($nextDate->getOffset() - $currentDate->getOffset()) / 3600; // Sekundy -> hodiny
  }

  /**
   * Vypise data a ukonci beh
   */
  private function __output(array $data) {
    $output = ['Date' => $this->__date];
    if (array_key_exists('data', $data) && $data['data']) {
      $output['Average'] = $this->__priceAverage($data['data']);
      $output['Data'] = $data['data'];
    }
    if (array_key_exists('error', $data) && $data['error']) {
      $output['Error'] = $data['error'];
    }

    if ($this->__toFile) {
      if (false !== saveJSON($this->__date === date('Y-m-d') ? FILE_PRICES : FILE_PREDICTION, $output, LOCK_EX)) {
        http_response_code(200);
      } else {
        http_response_code(500);
      }
      exit;
    }

    echoJSON($output, false);
  }

  /**
   * Zpracuje kurzy men
   */
  private function __parseCurrency() {
    $data = $this->__getContents($this->__currencyDataURL);
    if (null === $data) {
      return null;
    }

    $exchange = $data['kurzy'][self::CURRENCY]['dev_stred'];
    $unit = $data['kurzy'][self::CURRENCY]['jednotka'];

    if (!isset($exchange) || !isset($unit)) {
      $this->__output(['error' => 'Failed to read '.self::CURRENCY.' exchange rate? kurzy->'.self::CURRENCY.'->(dev_stred | jednotka)']);
      return null;
    }

    return $this->__eurExchangeRate = $exchange / $unit;
  }

  /**
   * Zpracuje casovou radu OTE cen
   */
  private function __parseGraphData() {
    $data = $this->__getContents($this->__graphDataURL);
    if (null === $data) {
      return null;
    }

    $dataLines = $data['data']['dataLine'];
    if (!isset($dataLines)) {
      $this->__output(['error' => 'Failed to read OTE market indices - possible missing keys? data->dataLine']);
      return null;
    }
    if (!count($dataLines)) {
      $this->__output(['error' => 'Unable to read data lines - possible empty? data->dataLine']);
      return null;
    }

    $granularity = $this->__granularities[$this->__metering];
    $pricesDataLines = array_filter($dataLines, function ($dl) use ($granularity) {
      return '1' === $dl['type'] && false !== stripos($dl['title'], self::CURRENCY) && false !== stripos($dl['title'], $granularity);
    });

    $linesCount = count($pricesDataLines);
    if (1 !== $linesCount) { // 1 => jedna datova rada ceny za MWh (po 15 nebo 60 min.)
      $this->__output(['error' => 'Zero or more than one data lines found. data->dataLine']);
      return null;
    }

    $points = array_values($pricesDataLines)[0]['point'];
    if (!isset($points)) {
      $this->__output(['error' => 'Unable to read data points - possible missing keys? data->dataLine ... point']);
      return null;
    }
    if (!count($points)) {
      $this->__output(['error' => 'Unable to read data points - possible empty? data->dataLine ... point']);
      return null;
    }

    $offset = $this->__getDSTChange();
    $rate = $this->__eurExchangeRate;
    $metering = $this->__metering;
    $priceDataLine = array_map(function ($pt) use ($offset, $rate, $metering) {
      $timePoint = +$pt['x'] - 1;
      $hour = 0;
      $minute = 0;

      if (1 === $metering) { // 15 min.
        $hour = intval($timePoint / 4);
        $minute = 15 * ($timePoint % 4);
      } else { // 60 min.
        $hour = intval($timePoint);
      }
      if ((0 < $offset && 1 < $hour) || (0 > $offset && 2 < $hour)) {
        $hour += $offset;
      }

      $time = sprintf("%02d:%02d", $hour, $minute);
      $price = round($pt['y'] * $rate, DECIMAL_PLACES);

      return [
        'Time'  => $time,
        'Price' => $price
      ];
    }, $points);

    $this->__output(['data' => $priceDataLine]);
    return true;
  }

}

/**
 * Vytvori instanci a spusti ji
 */
$pricesParser = new PricesParser();
$pricesParser->run();
