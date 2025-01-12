<?php

require_once __DIR__ . '/constants.php';

/**
 * Trida pro zjistovani nejnizsi ceny pro nabijeni
 */
class Charger {

  /**
   * Nastaveni
   */
  private $__settings;

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

    $this->__settings = json_decode(file_get_contents(FILE_SETTINGS), true);
  }

  /**
   * Hlavni behova metoda
   */
  public function run() {
    if (!$this->__isConfigSet($smartCharge = $this->__settings['SmartCharge'], ['HourEnd',  'HourStart', 'MinBatterySoC',  'MonthEnd', 'MonthStart', 'PricesCount', 'Status'])) {
      return;
    }

    if (!$smartCharge['Status']) {
      $this->__output(['error' => 'SmartCharge is off']);
      return; // Rizeni vypnuto
    }

    $month = +date('n');
    if ($month < $smartCharge['MonthStart'] && $month > $smartCharge['MonthEnd']) { // Musi byt v danem rozsahu roku
      $this->__output(['error' => 'Month range is outside selected']);
      return;
    }

    $this->__getPrice($smartCharge['HourStart'], $smartCharge['HourEnd'], $smartCharge['PricesCount']);
  }

  /**
   * Premapuje data cen na pole dat s cenami a hodinami
   */
  private function __fixPrices(array $prices) {
    if (!is_array($prices)) {
      return null;
    }
    return array_map(function ($item) use ($prices) {
      return ['Date' => $prices['Date'], 'Hour' => $item['Hour'], 'Price' => $item['Price']];
    }, $prices['Data']);
  }

  /**
   * Vrati nejnizsi cenu z dnesnich a zitrejsich cen OTE
   */
  private function __getPrice($hourStart, $hourEnd, $pricesCount) {
    $pricesToday = array_filter($this->__fixPrices($this->__readPrices()) ?? [], function ($record) use ($hourStart) {
      return $record['Hour'] >= $hourStart;
    });
    $pricesTomorrow = array_filter($this->__fixPrices($this->__readPrices(true)) ?? [], function ($record) use ($hourEnd) {
      return $record['Hour'] <= $hourEnd;
    });

    $prices = array_merge($pricesToday, $pricesTomorrow);
    if (0 === count($prices)) {
      $this->__output(['error' => "No data for given hour range {$hourStart} - {$hourEnd}"]);
      exit;
    }

    $sorted = $prices;
    usort($sorted, function ($recordA, $recordB) {
      return $recordA['Price'] <=> $recordB['Price'];
    });

    $this->__output(array_slice($sorted, 0, $pricesCount));
  }

  /**
   * Zkontroluje existenci klicu konfigurace
   */
  private function __isConfigSet(array $config, array $keys) {
    return array_reduce($keys, function ($acc, $key) use ($config) {
      return $acc && isset($config[$key]);
    }, isset($config));
  }

  /**
   * Vypise data a ukonci beh
   */
  private function __output(array $data) {
    $output = [];
    if (array_key_exists('error', $data) && $data['error']) {
      $output['Error'] = $data['error'];
    } else {
      $output = $data;
    }

    $json = str_replace('    ', '  ', json_encode($output, JSON_PRETTY_PRINT)) . "\n";
    if ($this->__toFile) {
      header('Content-type: text/plain; charset="UTF-8"');
      if (false !== file_put_contents(FILE_CHARGE, $json, LOCK_EX)) {
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
   * Nacte ceny OTE
   */
  private function __readPrices($nextDay = false) {
    ob_start();

    $_REQUEST['json'] = '';
    $_REQUEST['date'] = date('Y-m-d', strtotime($nextDay ? 'tomorrow' : 'today'));

    if (class_exists('PricesParser')) {
      $pricesParser2 = new PricesParser();
      $pricesParser2->run();
    } else {
      require_once __DIR__ . '/parser.php';
    }

    $data = ob_get_clean();
    if ('' === $data) {
      return null;
    }

    $prices = json_decode($data, true);
    if (!is_array($prices) || !array_key_exists('Data', $prices)) {
      return null;
    }

    return $prices;
  }

}

/**
 * Vytvori instanci a spusti ji
 */
$charger = new Charger();
$charger->run();
