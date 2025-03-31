<?php

require_once __DIR__ . '/constants.php';

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
  private const PLACEHOLDER = '%date%';

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
   */
  private $__graphDataURL = 'https://www.ote-cr.cz/cs/kratkodobe-trhy/elektrina/denni-trh/@@chart-data?report_date=%date%';

  /**
   * Cenovy prah
   */
  private $__threshold = 1000;

  /**
   * Priznak ukladani do souboru
   */
  private $__toFile = true;

  /**
   * Konstruktor
   */
  public function __construct() {
    if (isset($_REQUEST['json'])) {
      $this->__toFile = false;
    }

    if (isset($_REQUEST['date'])) {
      $this->__date = $_REQUEST['date'];
    }
    if (isset($_REQUEST['1'])) {
      $this->__date = date('Y-m-d', strtotime('+1 day'));
    }
    $this->__graphDataURL = str_replace(self::PLACEHOLDER, $this->__date, $this->__graphDataURL);

    $currencyDate = $this->__date < TODAY ? 'den[' . date('Ymd', strtotime($this->__date)) . ']' : '';
    $this->__currencyDataURL = str_replace(self::PLACEHOLDER, $currencyDate, $this->__currencyDataURL);
  }

  /**
   * Hlavni behova metoda
   */
  public function run() {
    $this->__loadSettings();
    $this->__parseCurrency();
    $this->__parseGraphData();
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
    $data = @file_get_contents($url);
    if (false === $data) {
      $this->__output(array('error' => "No data for {$url}"));
      exit;
    }

    $decoded = json_decode($data, true);
    if (null === $decoded) {
      $this->__output(array('error' => "Decoding data failed for {$url}"));
      exit;
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
   * Nacte nastaveni
   */
  private function __loadSettings() {
    $data = $this->__getContents(FILE_SETTINGS);
    $threshold =  $data['Threshold'];
    if (!isset($threshold)) {
      $this->__output(array('error' => 'Unable to load threshold from settings.'));
      exit;
    }

    $this->__threshold = $threshold;
  }

  /**
   * Vypise data a ukonci beh
   */
  private function __output(array $data) {
    $output = ['Date' => $this->__date];
    if (array_key_exists('data', $data) && $data['data']) {
      $output['Average'] = $this->__priceAverage($data['data']);
      $output['Threshold'] = $this->__threshold;
      $output['Data'] = $data['data'];
    }
    if (array_key_exists('error', $data) && $data['error']) {
      $output['Error'] = $data['error'];
    }

    $json = toJSON($output);
    if ($this->__toFile) {
      if (false !== file_put_contents($this->__date === date('Y-m-d') ? FILE_PRICES : FILE_PREDICTION, $json, LOCK_EX)) {
        http_response_code(200);
      } else {
        http_response_code(500);
      }
      exit;
    }

    header('Content-type: application/json; charset="UTF-8"');
    echo $json;
  }

  /**
   * Zpracuje kurzy men
   */
  private function __parseCurrency() {
    $data = $this->__getContents($this->__currencyDataURL);
    $exchange = $data['kurzy'][self::CURRENCY]['dev_stred'];
    $unit = $data['kurzy'][self::CURRENCY]['jednotka'];

    if (!isset($exchange) || !isset($unit)) {
      $this->__output(array('error' => 'Failed to read ' . self::CURRENCY . ' exchange rate? kurzy->' . self::CURRENCY . '->(dev_stred | jednotka)'));
      exit;
    }

    $this->__eurExchangeRate = $exchange / $unit;
  }

  /**
   * Zpracuje casovou radu OTE cen
   */
  private function __parseGraphData() {
    $data = $this->__getContents($this->__graphDataURL);
    $dataLines = $data['data']['dataLine'];

    if (!isset($dataLines)) {
      $this->__output(array('error' => 'Failed to read OTE market indices - possible missing keys? data->dataLine'));
      exit;
    }
    if (!count($dataLines)) {
      $this->__output(array('error' => 'Unable to read data lines - possible empty? data->dataLine'));
      exit;
    }

    $pricesDataLines = array_filter($dataLines, function ($dl) {
      return '1' === $dl['type'] || (false !== stripos($dl['title'], self::CURRENCY));
    });

    $linesCount = count($pricesDataLines);
    if (1 !== $linesCount) { // 1 => jedna datova rada ceny za MWh
      $this->__output(array('error' => 'Zero or more than one data lines found. data->dataLine'));
      exit;
    }

    $points = array_values($pricesDataLines)[0]['point'];
    if (!isset($points)) {
      $this->__output(array('error' => 'Unable to read data points - possible missing keys? data->dataLine ... point'));
      exit;
    }
    if (!count($points)) {
      $this->__output(array('error' => 'Unable to read data points - possible empty? data->dataLine ... point'));
      exit;
    }


    $offset = $this->__getDSTChange();
    $rate = $this->__eurExchangeRate;
    $threshold = $this->__threshold;
    $priceDataLine = array_map(function ($pt) use ($offset, $rate, $threshold) {
      $hour = $pt['x'] - 1;
      if ((0 < $offset && 1 < $hour) || (0 > $offset && 2 < $hour)) {
        $hour += $offset;
      }
      $price = round($pt['y'] * $rate, DECIMAL_PLACES);

      return array(
        'Allow' => $price > $threshold,
        'Hour'  => $hour,
        'Price' => $price
      );
    }, $points);

    $this->__output(array('data' => $priceDataLine));
  }

}

/**
 * Vytvori instanci a spusti ji
 */
$pricesParser = new PricesParser();
$pricesParser->run();
