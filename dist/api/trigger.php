<?php

require_once __DIR__.'/constants.php';
require_once CLASS_INVERTER;

/**
 * Uroven logovani - zadny
 */
const LOG_NONE = 0;

/**
 * Uroven logovani - zmena
 */
const LOG_CHANGE = 1 << 0;

/**
 * Uroven logovani - informace
 */
const LOG_MESSAGE = 1 << 1;

/**
 * Uroven logovani - vse
 */
const LOG_ALL = LOG_MESSAGE | LOG_CHANGE;

/**
 * Marze obchodnika
 */
const TRADE_MARGIN = 500.0; // Kc/MWh

/**
 * Trida spoustece kontroly rizeni FVE
 */
class Trigger {

  /**
   * Ceny OTE
   */
  private $__prices;

  /**
   * Nastaveni
   */
  private $__settings;

  /**
   * Instance dat senzoru SolaX
   */
  private $__solax;

  /**
   * Uroven "ukecaneho" vystupu
   */
  private $__verboseLevel = LOG_NONE;

  /**
   * Konstruktor
   */
  public function __construct() {
    $this->__settings = readJSON(FILE_SETTINGS);
    $this->__solax = new SolaX($this->__settings);

    if (isset($this->__settings['VerboseLevel'])) {
      $this->__verboseLevel = +$this->__settings['VerboseLevel'];
    }
    if (isset($_REQUEST['verbose'])) {
      $this->__verboseLevel = is_numeric($_REQUEST['verbose']) ? +$_REQUEST['verbose'] : LOG_ALL;
    }
  }

  /**
   * Hlavni behova metoda
   */
  public function run() {
    $this->__checkPrices();
    $this->__checkSmartCharge();
    $this->__checkSmartExport();
    $this->__checkExport();
  }

  /**
   * Kontrola rizeni exportu
   */
  private function __checkExport() {
    $keys = [
      'NegativePriceBiasMode', 'NegativePriceBiasPower', 'NegativePriceHandling', 'NegativePriceOffValue', 'OffMode', 'OffValue', 'OnValue',
      'ProfitPriceBiasPower', 'ProfitPriceHandling', 'ProfitPriceMaxQuarterCount', 'ProfitPriceMinBatterySoC', 'ProfitPriceMinValue','Status'
    ];
    if (!$this->__isConfigSet($export = $this->__settings['Export'], $keys)) {
      $this->__log('ExportControl: invalid config', LOG_MESSAGE);
      return;
    }

    if (!$export['Status']) {
      $this->__log('ExportControl: off', LOG_MESSAGE);
      return; // Rizeni vypnuto
    }

    $nextTime = strtotime('+5 minutes');
    $nextQuarter = $this->__getHourQuarter($nextTime);
    $biasSet = null !== Bias::Mode() || null !== Bias::Power();

    if (!$biasSet && ($nextQuarter >= '21:30' || $nextQuarter <= '05:30')) {
      $this->__log('ExportControl: stopped', LOG_MESSAGE);
      return; // Rizeni od 21:30 do 5:30 pozastaveno
    }

    $entry = $this->__getPriceByQuarter($nextQuarter);
    if (!isset($entry)) {
      $this->__log('ExportControl: invalid price', LOG_MESSAGE);
      return;
    }

    if ($export['NegativePriceHandling'] && +$entry['Price'] <= TRADE_MARGIN) { // v pripade nulovych nebo zapornych cen
      $this->__setNegativePriceHandling($export);
    }

    if ($export['ProfitPriceHandling'] && +$entry['Price'] >= +$export['ProfitPriceMinValue']) { // v pripade vyhodnych cen (prevazne vecer)
      $this->__setProfitPriceHandling($export, $entry);
    }

    $biasMode = $this->__solax->getRegistryValue('BiasMode', false, true);
    if (null !== ($modeBias = Bias::Mode()) && $biasMode !== $modeBias) {
      Bias::Mode(null);
      $status = $this->__solax->setRegistryValue('BiasMode', $modeBias) ? 'set' : 'failure';
      $this->__log("ExportControl: bias mode '".SolaX::BIAS_MODES[$biasMode]."' -> '".SolaX::BIAS_MODES[$modeBias]."' - {$status}", LOG_CHANGE);
    }

    $biasPower = $this->__solax->getRegistryValue('BiasPower', false);
    if (null !== ($powerBias = Bias::Power()) && $biasPower !== $powerBias) {
      Bias::Power(null);
      $status = $this->__solax->setRegistryValue('BiasPower', $powerBias) ? 'set' : 'failure';
      $this->__log("ExportControl: bias power {$biasPower} W -> {$powerBias} W - {$status}", LOG_CHANGE);
    }

    if ($this->__testNonprofitablePricePeak($nextTime)) {
      $this->__log('ExportControl: nonprofitable peak -> quitting', LOG_MESSAGE);
      return;
    }

    $isProfitable = $entry['Price'] >= $this->__settings['Threshold'];

    $workingMode = $this->__solax->getRegistryValue('WorkingMode', false, true);
    $requiredMode = $isProfitable ? $this->__solax->WorkingModeSelfUse : $export['OffMode'];
    if ($workingMode !== $requiredMode) {
      $status = $this->__solax->setRegistryValue('WorkingMode', $requiredMode) ? 'set' : 'failure';
      $this->__log("ExportControl: working mode '".SolaX::WORKING_MODES[$workingMode]."' -> '".SolaX::WORKING_MODES[$requiredMode]."' - {$status}", LOG_CHANGE);
    }

    $exportValue = $this->__solax->getRegistryValue('ExportControl', false);
    if (!isset($exportValue)) {
      $this->__log('ExportControl: "ExportControl" value not loaded', LOG_MESSAGE);
      return;
    }

    $requiredValue = $export[$isProfitable ? 'OnValue' : 'OffValue'];
    if (!isset($requiredValue)) {
      $this->__log('ExportControl: required value not loaded', LOG_MESSAGE);
      return;
    }

    if ($exportValue !== $requiredValue) {
      $status = $this->__solax->setRegistryValue('ExportControl', $requiredValue) ? 'set' : 'failure';
      $this->__log("ExportControl: export {$exportValue} W -> {$requiredValue} W - {$status}", LOG_CHANGE);
    } else {
      $this->__log('ExportControl: no change made', LOG_MESSAGE);
    }
  }

  /**
   * Kontrola nacteni cen OTE
   */
  private function __checkPrices() {
    $this->__prices = readJSON(FILE_PRICES);
    if (!isset($this->__prices['Data'])) {
      $this->__log('CheckPrices: loading today\'s prices from OTE and quitting', LOG_MESSAGE);
      require_once __DIR__.'/parser.php';
      exit;
    }

    $now = time();
    $prediction = readJSON(FILE_PREDICTION);
    if (13 <= +date('G', $now + 120) && isset($prediction['Error'])) { // nejdrive ve 13:00 jsou ceny na dalsi den
      $this->__log('CheckPrices: loading tomorrow\'s prices from OTE', LOG_MESSAGE);
      ob_start();

      $_REQUEST['json'] = '';
      $_REQUEST['date'] = date('Y-m-d', strtotime('tomorrow'));

      if (class_exists('PricesParser')) {
        $pricesParser2 = new PricesParser();
        $pricesParser2->run();
      } else {
        require_once __DIR__.'/parser.php';
      }

      $data = ob_get_clean();
      if ('' === $data) {
        return $this->__wait($now);
      }

      $this->__log('CheckPrices: saving tomorrow\'s prices to file', LOG_MESSAGE);
      file_put_contents(FILE_PREDICTION, $data);
      $prediction = json_decode($data, true);
    }

    if (!isset($prediction['Data'])) {
      return $this->__wait($now);
    }

    $next = $now + 300; // + 5 minut
    if (0 === +date('G', $next) && $this->__prices['Date'] < (date('Y-m-d', $next))) { // dalsi den a prices nejsou prediction: prediction -> prices
      $this->__log('CheckPrices: switching prices', LOG_MESSAGE);

      saveJSON(FILE_PRICES, $prediction);
      $this->__prices = $prediction;

      $prediction = ['Date' => date('Y-m-d', $next + 86400), 'Error' => 'ErrorPricesNotPublishedYet'];
      saveJSON(FILE_PREDICTION, $prediction);
    }

    if (isset($prediction['Data']) && is_array($prediction['Data']) && 0 < count($prediction['Data'])) {
      $this->__setChargePrices($prediction);
    }

    return $this->__wait($now);
  }

  /**
   * Kontrola SmartCharge - chytre nabijeni
   *
   * Uvaha je nasledujici: pri nabijecim proudu Ic = 30 A a napeti Uc = 230 V
   * je prikon nabijeni cca Pc = 6900 W. Pri kapacite akumulatoru 11,5 kWh je
   * potreba z 25% nabiti (~ 2,9 kWh) na 80 % (~ 9,2 kWh) asi 6,3 kWh. Pri
   * nabijeni 6,9 kW je to _1_ hodina, tedy nejnizsi cena z daneho hodinoveho
   * intervalu.
   *
   * Princip: Vyfiltrovat ze dne 1 hodiny s nejnizsi spotovou cenou. Zjistit
   * stav nabiti baterie a pokud je pod 80 %, prepnout do manualniho rezimu a
   * nastavit nucene nabijeni. V opacnem pripade prepnout na vlastni spotrebu.
   *
   * Edit: bohuzel jedna hodina nestaci, nutno pridat dalsi… Jde totiz o to, ze
   * nabijeni zavisi na BMS a teplote akumulatoru:
   *  18°C ~  12,0 A (*)
   *  18°C ~  18,5 A
   *  19°C ~  21,5 A
   *  20°C ~  22,0 A
   *  21°C ~  22,2 A (*)
   * >21°C ~  25,0 A
   * >23°C ~ >25,0 A
   */
  private function __checkSmartCharge() {
    $keys = ['HourEnd', 'HourStart', 'ManualControl', 'MinBatterySoC', 'MonthEnd', 'MonthStart', 'OffPVEPower', 'Status'];
    if (!$this->__isConfigSet($settings = $this->__settings['SmartCharge'], $keys)) {
      $this->__log('SmartCharge: invalid config', LOG_MESSAGE);
      return;
    }

    $nextTime = strtotime('+5 minutes');
    $nextDate = date('Y-m-d', $nextTime);
    $nextQuarter = $this->__getHourQuarter($nextTime);

    if ($settings['ManualControl']) {
      $currentEntry = $this->__getPriceByQuarter($nextQuarter);
      $currentCharge = isset($currentEntry) ? isset($currentEntry['Charge']) && $currentEntry['Charge'] : false;

      $status = [
        'SmartCharge' => false,
        'WorkingMode' => false
      ];
      if (!$currentCharge) {
        $this->__turnOffCharging($status);
      }

      $batterySoC = $this->__solax->getRealValue('BatteryRemainingCapacity', false, true);
      if ($currentCharge) {
        $this->__turnOnCharging($status, $batterySoC);
      }
    }

    if (!$settings['Status']) {
      $this->__log('SmartCharge: off', LOG_MESSAGE);
      return; // Rizeni vypnuto
    }

    $month = +date('n');
    if ($month < $settings['MonthStart'] && $month > $settings['MonthEnd']) { // Musi byt v danem rozsahu roku
      $this->__log('SmartCharge: not in months range', LOG_MESSAGE);
      return;
    }

    if ($nextQuarter < $this->__hourToTime($settings['HourStart']) && $nextQuarter > $this->__hourToTime($settings['HourEnd'])) { // Musi byt ve spoustenem intervalu dne
      $this->__log('SmartCharge: not in hours range', LOG_MESSAGE);
      return;
    }

    $charge = readJSON(FILE_CHARGE, "null");
    if (null === $charge) {
      $this->__log('SmartCharge: file not loaded', LOG_MESSAGE);
      return;
    }

    if (!isset($charge['Data']) || !is_array($charge['Data']) || 0 === count($charge['Data'])) {
      $this->__log('SmartCharge: prices not loaded', LOG_MESSAGE);
      return;
    }

    $status = [
      'SmartCharge' => false,
      'WorkingMode' => false
    ];

    $record = [
      'Date'  => '0000-00-00',
      'Time'  => '',
      'Price' => 0
    ];
    foreach ($charge['Data'] as $chargePrice) {
      if (isset($chargePrice['Date']) && isset($chargePrice['Time']) && $nextDate === $chargePrice['Date'] && $nextQuarter === $chargePrice['Time']) {
        $record = $chargePrice;
        break;
      }
    }

    $batterySoC = $this->__solax->getRealValue('BatteryRemainingCapacity', false, true);
    if ($batterySoC > $settings['MinBatterySoC']) { // SoC aku musi byt nizsi nez MinBatterySoC
      $this->__log("SmartCharge: battery charged - {$batterySoC} %", LOG_MESSAGE);
      $this->__turnOffCharging($status);
      return;
    }

    $pvePower = $this->__solax->getRealValue('PV1Power', false) + $this->__solax->getRealValue('PV2Power', false);
    if ($pvePower >= $settings['OffPVEPower']) { // Vykon nesmi byt vyssi nez OffPVEPower
      $this->__log("SmartCharge: too much PVE power - {$pvePower} W", LOG_MESSAGE);
      $this->__turnOffCharging($status);
      return;
    }

    if ($nextDate === $record['Date'] && $nextQuarter === $record['Time']) { // Zapne nabijeni akumulatoru
      $this->__turnOnCharging($status, $batterySoC);
    }

    if ('' === $record['Time']) {
      $this->__turnOffCharging($status);
      return;
    }

    if (!$status['SmartCharge'] && !$status['WorkingMode']) {
      $this->__log('SmartCharge: no change made', LOG_MESSAGE);
    }
  }

  /**
   * Kontrola SmartExport - chytre rizeni exportu
   */
  private function __checkSmartExport() {
    $keys = ['HourEnd', 'HourStart', 'MinBatterySoC', 'MinPVEPower', 'MonthEnd', 'MonthStart', 'QuartersBelowThreshold', 'Status'];
    if (!$this->__isConfigSet($settings = $this->__settings, ['Threshold']) ||
        !$this->__isConfigSet($export = $settings['Export'], ['OnValue', 'Status']) ||
        !$this->__isConfigSet($smartExport = $settings['SmartExport'], $keys)) {
      $this->__log('SmartExport: invalid config', LOG_MESSAGE);
      return;
    }

    if (!$export['Status'] || !$smartExport['Status']) {
      $this->__log('SmartExport: off', LOG_MESSAGE);
      return; // Rizeni vypnuto
    }

    $month = +date('n');
    if ($month < $smartExport['MonthStart'] || $month > $smartExport['MonthEnd']) { // Musi byt v danem rozsahu roku
      $this->__log('SmartExport: not in months range', LOG_MESSAGE);
      return;
    }

    $nextQuarter = $this->__getHourQuarter(strtotime('+5 minutes'));
    if ($nextQuarter < $this->__hourToTime($smartExport['HourStart']) || $nextQuarter > $this->__hourToTime($smartExport['HourEnd'])) { // Musi byt ve spoustenem intervalu dne
      $this->__log('SmartExport: not in hours range', LOG_MESSAGE);
      return;
    }

    $threshold = $this->__settings['Threshold'];
    $pricesBelowThreshold = array_filter($this->__prices['Data'], function ($item) use ($smartExport, $threshold) {
      return $item['Price'] < $threshold && $item['Time'] >= $this->__hourToTime($smartExport['HourStart']) && $item['Time'] <= $this->__hourToTime($smartExport['HourEnd']);
    });
    if (count($pricesBelowThreshold) < $smartExport['QuartersBelowThreshold']) { // Musi byt alespon pocet QuartersBelowThreshold
      $this->__log('SmartExport: quarters count is insufficient', LOG_MESSAGE);
      return;
    }

    $price = $this->__getPriceByQuarter($nextQuarter);
    if (!isset($price) || $price['Price'] < $threshold) { // Cena OTE musi byt rentabilni
      $this->__log('SmartExport: price not profitable', LOG_MESSAGE);
      return;
    }

    if ($this->__prices['Average'] < $threshold) { // Denni prumer musi byt vyssi nez Threshold
      $this->__log('SmartExport: price average not profitable', LOG_MESSAGE);
      return;
    }

    $pvePower = $this->__solax->getRealValue('PV1Power', false, true) + $this->__solax->getRealValue('PV2Power', false);
    if ($pvePower < $smartExport['MinPVEPower']) { // Vykon musi byt min. MinPVEPower
      $this->__log('SmartExport: not enough PVE power', LOG_MESSAGE);
      return;
    }

    $batterySoC = $this->__solax->getRealValue('BatteryRemainingCapacity', false);
    if ($batterySoC < $smartExport['MinBatterySoC']) { // SoC aku musi byt min. MinBatterySoC
      $this->__log('SmartExport: below battery SoC', LOG_MESSAGE);
      return;
    }

    $attempts = 2;
    $exportValue = $this->__solax->getRegistryValue('ExportControl', false, true);
    $workingMode = $this->__solax->getRegistryValue('WorkingMode', false);
    while (!isset($workingMode) || !isset($exportValue)) {
      if ($attempts--) {
        $this->__log('SmartExport: neither ExportControl value nor Working mode loaded, one more try...', LOG_MESSAGE);
        sleep(2);
        $exportValue = $this->__solax->getRegistryValue('ExportControl', false, true);
        $workingMode = $this->__solax->getRegistryValue('WorkingMode', false);
      } else {
        $this->__log('SmartExport: ExportControl and Working mode not loaded, fallback to default...', LOG_MESSAGE);
        return;
      }
    }

    // -> nastavime export na OnValue a WorkMode na FeedIn
    $status = [
      'ExportControl' => null,
      'WorkingMode'   => null
    ];

    if ($exportValue !== $export['OnValue']) {
      $status['ExportControl'] = $this->__solax->setRegistryValue('ExportControl', $onValue = $export['OnValue']);
      $statusText = $status['ExportControl'] ? 'set' : 'failure';
      $this->__log("SmartExport: export {$exportValue} W -> {$onValue} W - {$statusText}", LOG_CHANGE);
    } else {
      $status['ExportControl'] = true;
    }

    if ($workingMode !== $this->__solax->WorkingModeFeedIn) {
      $status['WorkingMode'] = $this->__solax->setRegistryValue('WorkingMode', $this->__solax->WorkingModeFeedIn);
      $statusText = $status['WorkingMode'] ? 'set' : 'failure';
      $this->__log("SmartExport: working mode '".SolaX::WORKING_MODES[$workingMode]."' -> 'WorkingModeFeedIn' - {$statusText}", LOG_CHANGE);
    } else {
      $status['WorkingMode'] = true;
    }

    if ($status['ExportControl'] || $status['WorkingMode']) {
      $this->__log('SmartExport: all set, quitting', LOG_MESSAGE);
      exit; // zmeny zaznamenany, vse OK -> konec
    }

    if (!$status['ExportControl'] && !$status['WorkingMode']) {
      $this->__log('SmartExport: no change made', LOG_MESSAGE);
    }
  }

  /**
   * Vrati spravnou hodnotu pri zmene casu
   * POZN.: musi byt radne nastaveno date_default_timezone_set()
   */
  private function __getCorrectHour(array $prices) {
    $time1 = time() + 900;  // + 15 min.
    $time2 = $time1 + 3600; // + hodina
    $diff = +date('I', $time1) - +date('I', $time2);
    return $prices[0 < $diff ? 0 : 1];
  }

  /**
   * Dle timestamp a nastaveni vrati pocatek ctvrthodinoveho intervalu jako "HH:MM"
   */
  private function __getHourQuarter($timestamp) {
    $hour = +date('G', $timestamp);
    $minute = 0;

    $interval = isset($this->__settings['MeteringInterval']) ? +$this->__settings['MeteringInterval'] : 0;
    if (1 === $interval) { // 15 min.
      $minute = 15 * intval(+date('i', $timestamp) / 15);
    }

    return sprintf("%02d:%02d", $hour, $minute);
  }

  /**
   * Vrati cenu dle ctvrthodiny
   */
  private function __getPriceByQuarter($quarter) {
    if (!isset($this->__prices['Data']) || 0 === count($this->__prices['Data'])) {
      $this->__log('Trigger: prices not loaded', LOG_MESSAGE);
      return null;
    }

    if (!isset($quarter) || !$quarter) {
      $this->__log('Trigger: invalid quarter', LOG_MESSAGE);
      return null;
    }

    $filtered = array_filter($this->__prices['Data'], function ($item) use ($quarter) {
      return $quarter === $item['Time'];
    });

    return 2 === count($filtered) ? $this->__getCorrectHour($filtered) : reset($filtered);
  }

  /**
   * Prevede hodinu na cas
   */
  private function __hourToTime($hour) {
    return sprintf("%02d:00", $hour);
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
   * Zapise do logu
   */
  private function __log($message, $level) {
    ($this->__verboseLevel & $level) && file_put_contents(FILE_OUTPUT, date('[c]')." {$message}".PHP_EOL, FILE_APPEND | LOCK_EX);
  }

  /**
   * Nastavi data chytreho nabijeni
   */
  private function __setChargePrices(array $prediction) {
    if (!$this->__isConfigSet($settings = $this->__settings['SmartCharge'], ['HourEnd', 'HourStart', 'MonthEnd', 'MonthStart', 'PricesCount', 'Status'])) {
      $this->__log('SmartChargePrices: invalid config', LOG_MESSAGE);
      return;
    }

    $today = date('Y-m-d');
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    $charge = readJSON(FILE_CHARGE);
    $generated = isset($charge['Date']) ? $charge['Date'] === $today : false;

    if (!$settings['Status']) { // Rizeni vypnuto
      if (!$generated || (isset($charge['Data']) && 0 < count($charge['Data']))) {
        saveJSON(FILE_CHARGE, ['Date' => $today, 'Error' => 'ErrorSmartChargeOff']);
      }
      return;
    }

    $month = +date('n');
    if ($month < $settings['MonthStart'] && $month > $settings['MonthEnd']) { // Musi byt v danem rozsahu roku
      if (!$generated) {
        saveJSON(FILE_CHARGE, ['Date' => $today, 'Error' => 'ErrorMonthOutsideSelectedRange']);
      }
      return;
    }

    if (isset($charge['Count']) && isset($charge['Data']) &&
        $charge['Count'] === count($charge['Data']) &&
        $charge['Count'] === $settings['PricesCount'] &&
        $generated) { // Vsechno sedi
      return;
    }

    $data = ['Date' => $today, 'Count' => $settings['PricesCount']];
    $fixPrices = function ($prices, $date) {
      if (!is_array($prices)) {
        return null;
      }
      return array_map(function ($item) use ($date) {
        return isset($date, $item['Time'], $item['Price']) ? ['Date' => $date, 'Time' => $item['Time'], 'Price' => $item['Price']] : [];
      }, $prices);
    };

    $fromTime = $this->__hourToTime($settings['HourStart']);
    $toTime = $this->__hourToTime($settings['HourEnd']);

    $pricesToday = array_filter($fixPrices($this->__prices['Data'], $today) ?? [], function ($record) use ($fromTime) {
      return $record['Time'] >= $fromTime;
    });
    $pricesTomorrow = array_filter($fixPrices($prediction['Data'], $tomorrow) ?? [], function ($record) use ($toTime) {
      return $record['Time'] <= $toTime;
    });
    $prices = array_merge($pricesToday, $pricesTomorrow);

    if (0 === count($prices)) {
      $data['Error'] = ['ErrorNoDataForGivenHourRange', $settings['HourStart'], $settings['HourEnd']];
    } else {
      usort($prices, function ($recordA, $recordB) {
        return $recordA['Price'] <=> $recordB['Price'];
      });
      $data['Data'] = array_slice($prices, 0, $settings['PricesCount']);
    }

    saveJSON(FILE_CHARGE, $data);
  }

  /**
   * Nastavi parametry stridace pro "zaporne" ceny
   */
  private function __setNegativePriceHandling(array $settings) {
    $negativePriceStatus = [
      'BiasMode'      => false,
      'BiasPower'     => false,
      'ExportControl' => false
    ];

    $exportControl = $this->__solax->getRegistryValue('ExportControl', false, true);
    if (null !== $exportControl && $settings['NegativePriceOffValue'] !== $exportControl) {
      $negativePriceStatus['ExportControl'] = $this->__solax->setRegistryValue('ExportControl', $settings['NegativePriceOffValue']);
      $statusText = $negativePriceStatus['ExportControl'] ? 'set' : 'failure';
      $this->__log("ExportControl: export {$exportControl} W -> {$settings['NegativePriceOffValue']} W - {$statusText}", LOG_CHANGE);
    } else {
      $negativePriceStatus['ExportControl'] = true;
    }

    $biasMode = $this->__solax->getRegistryValue('BiasMode', false);
    if (null !== $biasMode && $settings['NegativePriceBiasMode'] !== $biasMode) {
      Bias::Mode($biasMode);
      $negativePriceStatus['BiasMode'] = $this->__solax->setRegistryValue('BiasMode', $settings['NegativePriceBiasMode']);
      $statusText = $negativePriceStatus['BiasMode'] ? 'set' : 'failure';
      $this->__log("ExportControl: bias mode '".SolaX::BIAS_MODES[$biasMode]."' -> '".SolaX::BIAS_MODES[$settings['NegativePriceBiasMode']]."' - {$statusText}", LOG_CHANGE);
    } else {
      $negativePriceStatus['BiasMode'] = true;
    }

    $biasPower = $this->__solax->getRegistryValue('BiasPower', false);
    if ($biasMode !== $this->__solax->BiasModeDisabled && null !== $biasPower && $settings['NegativePriceBiasPower'] !== $biasPower) {
      Bias::Power($biasPower);
      $negativePriceStatus['BiasPower'] = $this->__solax->setRegistryValue('BiasPower', $settings['NegativePriceBiasPower']);
      $statusText = $negativePriceStatus['BiasPower'] ? 'set' : 'failure';
      $this->__log("ExportControl: bias power {$biasPower} W -> {$settings['NegativePriceBiasPower']} W - {$statusText}", LOG_CHANGE);
    } else {
      $negativePriceStatus['BiasPower'] = true;
    }

    if ($negativePriceStatus['BiasMode'] || $negativePriceStatus['BiasPower'] || $negativePriceStatus['ExportControl']) {
      $this->__log('ExportControl: settings for negative price applied', LOG_MESSAGE);
      exit;
    }
  }

  /**
   * Nastavi parametry stridace pro "vynosne" ceny
   */
  private function __setProfitPriceHandling(array $settings, array $entry) {
    $profitPrice = +$settings['ProfitPriceMinValue'];
    $profitablePrices = array_reduce($this->__prices['Data'], function ($acc, $item) use ($profitPrice) {
      if (+$item['Price'] >= $profitPrice && $item['Time'] >= "16:00") { // min. hodina nastavena na 16.
        $acc[] = $item;
      }
      return $acc;
    }, []);

    usort($profitablePrices, function ($a, $b) {
      return $b['Price'] <=> $a['Price']; // sestupne
    });

    $priceIndex = (function () use ($entry, $profitablePrices) {
      foreach ($profitablePrices as $index => $item) {
        if (abs($entry['Price'] - $item['Price']) < 0.01 && $entry['Time'] === $item['Time']) {
          return $index;
        }
      }
      return -1;
    })();
    $isWithinQuarter = -1 != $priceIndex && $priceIndex < $settings['ProfitPriceMaxQuarterCount'];

    $batterySoC = $this->__solax->getRealValue('BatteryRemainingCapacity', false, true);
    $enoughEnergy = $batterySoC > $settings['ProfitPriceMinBatterySoC'];

    $profitPriceStatus = [
      'BiasMode'  => false,
      'BiasPower' => false
    ];

    if ($isWithinQuarter && $enoughEnergy) { // cena je vyhodna a mame dostatek energie v akumulatoru
      $biasMode = $this->__solax->getRegistryValue('BiasMode', false, true);
      if (($modeBias = $this->__solax->BiasModeGrid) !== $biasMode) {
        Bias::Mode($biasMode);
        $profitPriceStatus['BiasMode'] = $this->__solax->setRegistryValue('BiasMode', $modeBias);
        $statusText = $profitPriceStatus['BiasMode'] ? 'set' : 'failure';
        $this->__log("ExportControl: bias mode '".SolaX::BIAS_MODES[$biasMode]."' -> '".SolaX::BIAS_MODES[$modeBias]."' - {$statusText}", LOG_CHANGE);
      } else {
        $profitPriceStatus['BiasMode'] = true;
      }

      $biasPower = $this->__solax->getRegistryValue('BiasPower', false);
      if (null !== $biasPower && $settings['ProfitPriceBiasPower'] !== $biasPower) {
        Bias::Power($biasPower);
        $profitPriceStatus['BiasPower'] = $this->__solax->setRegistryValue('BiasPower', $settings['ProfitPriceBiasPower']);
        $statusText = $profitPriceStatus['BiasPower'] ? 'set' : 'failure';
        $this->__log("ExportControl: bias power {$biasPower} W -> {$settings['ProfitPriceBiasPower']} W - {$statusText}", LOG_CHANGE);
      } else {
        $profitPriceStatus['BiasPower'] = true;
      }
    }

    if ($profitPriceStatus['BiasMode'] || $profitPriceStatus['BiasPower']) {
      $this->__log('ExportControl: settings for profitable price applied', LOG_MESSAGE);
      exit;
    }
  }

  /**
   * Otestuje nevyhodny cenovy vykyv ctvrthodin
   */
  private function __testNonprofitablePricePeak($time) {
    $previousQuarter = $this->__getHourQuarter($time - 900);
    $currentQuarter = $this->__getHourQuarter($time);
    $nextQuarter = $this->__getHourQuarter($time + 900);

    if ($previousQuarter > $currentQuarter) { // kdyz je ctvrthodina z predchoziho dne
      return false;
    }
    if ($nextQuarter < $currentQuarter) { // kdyz je ctvrthodina z nasledujiciho dne
      return false;
    }

    $threshold = $this->__settings['Threshold'];
    if (!isset($threshold)) { // neni prah
      return false;
    }

    $previousEntry = $this->__getPriceByQuarter($previousQuarter);
    $currentEntry = $this->__getPriceByQuarter($currentQuarter);
    $nextEntry = $this->__getPriceByQuarter($nextQuarter);

    return $previousEntry['Price'] < $threshold &&
           $currentEntry['Price'] > $threshold &&
           $nextEntry['Price'] < $threshold;
  }

  /**
   * Vypne nabijeni akumulatoru
   */
  private function __turnOffCharging(array &$status) {
    $workingMode = $this->__solax->getRegistryValue('WorkingMode', false, true);
    $manualMode = $this->__solax->getRegistryValue('ManualModeCharging', false);
    if ($workingMode === $this->__solax->WorkingModeManual || $manualMode === $this->__solax->ManualModeForceCharge) {
      $batterySoC = $this->__solax->getRealValue('BatteryRemainingCapacity', false, true);
      $this->__log("SmartCharge: charging stopped, SoC: {$batterySoC} %", LOG_CHANGE);

      if ($manualMode === $this->__solax->ManualModeForceCharge) {
        $status['SmartCharge'] = $this->__solax->setRegistryValue('ManualModeCharging', $this->__solax->ManualModeChargingOff);
        $statusText = $status['SmartCharge'] ? 'set' : 'failure';
        $this->__log("SmartCharge: manual mode '".SolaX::MANUAL_MODES[$manualMode]."' -> 'ManualModeChargingOff' - {$statusText}", LOG_CHANGE);
      }

      if ($workingMode === $this->__solax->WorkingModeManual) {
        $status['WorkingMode'] = $this->__solax->setRegistryValue('WorkingMode', $this->__solax->WorkingModeSelfUse);
        $statusText = $status['WorkingMode'] ? 'set' : 'failure';
        $this->__log("SmartCharge: working mode '".SolaX::WORKING_MODES[$workingMode]."' -> 'WorkingModeSelfUse' - {$statusText}", LOG_CHANGE);
      }

      sleep(5);
    }
  }

  /**
   * Zapne nabijeni akumulatoru
   */
  private function __turnOnCharging(array &$status, $batterySoC) {
    sleep(5);

    $sleep = 15;
    $workingMode = $this->__solax->getRegistryValue('WorkingMode', false, true);
    if ($workingMode !== $this->__solax->WorkingModeManual) { // Kontrola nastaveni manualu
      $status['WorkingMode'] = $this->__solax->setRegistryValue('WorkingMode', $this->__solax->WorkingModeManual);
      $statusText = $status['WorkingMode'] ? 'set' : 'failure';
      $this->__log("SmartCharge: working mode '".SolaX::WORKING_MODES[$workingMode]."' -> 'WorkingModeManual' - {$statusText}", LOG_CHANGE);
    }

    if ($status['WorkingMode']) {
      while ($this->__solax->RunModeNormal !== $this->__solax->getRealValue('RunMode', false, true)) {
        sleep(5);
        $sleep -= 5;
      }
    }

    $manualMode = $this->__solax->getRegistryValue('ManualModeCharging', false);
    if ($manualMode !== $this->__solax->ManualModeForceCharge) {
      if (0 < $sleep) {
        sleep($sleep);
      }

      $status['SmartCharge'] = $this->__solax->setRegistryValue('ManualModeCharging', $this->__solax->ManualModeForceCharge);
      $statusText = $status['SmartCharge'] ? 'set' : 'failure';
      $this->__log("SmartCharge: manual mode '".SolaX::MANUAL_MODES[$manualMode]."' -> 'ManualModeForceCharge' - {$statusText}", LOG_CHANGE);
    }

    if ($status['WorkingMode'] && $status['SmartCharge']) {
      $this->__log("SmartCharge: charging started, SoC: {$batterySoC} %", LOG_CHANGE);
    }

    exit;
  }

  /**
   * Vyckavaci metoda
   */
  private function __wait($start, $delay = 45) { // 45s
    $wait = time() - $start;
    if ($delay < $wait) {
      return;
    }

    sleep($delay - $wait);
  }

}

/**
 * Vytvori instanci a spusti ji
 */
$trigger = new Trigger();
$trigger->run();
