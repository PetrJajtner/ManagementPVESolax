<?php

require_once __DIR__ . '/constants.php';
require_once __DIR__ . '/inverters/solax.php';

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
   * Uroven „ukecaneho“ vystupu
   */
  private $__verboseLevel = LOG_NONE;

  /**
   * Konstruktor
   */
  public function __construct() {
    if (isset($_REQUEST['verbose'])) {
      $this->__verboseLevel = is_numeric($_REQUEST['verbose']) ? +$_REQUEST['verbose'] : LOG_ALL;
    }

    $this->__prices = json_decode(file_get_contents(FILE_PRICES), true);
    if (!isset($this->__prices['Data'])) {
      require_once __DIR__ . '/parser.php';
      exit;
    }

    $this->__settings = json_decode(file_get_contents(FILE_SETTINGS), true);
    $this->__solax = new SolaX($this->__settings);
  }

  /**
   * Hlavni behova metoda
   */
  public function run() {
    $this->__checkSmartCharge();
    $this->__checkSmartExport();
    $this->__checkExport();
  }

  /**
   * Kontrola rizeni exportu
   */
  private function __checkExport() {
    if (!$this->__isConfigSet($export = $this->__settings['Export'], ['Status', 'OnValue', 'OffValue'])) {
      $this->__log('ExportControl: invalid config', LOG_MESSAGE);
      return;
    }

    if (!$export['Status']) {
      $this->__log('ExportControl: off', LOG_MESSAGE);
      return; // Rizeni vypnuto
    }

    $workingMode = $this->__solax->getRegistryValue('WorkingMode', false, true);
    if (!isset($workingMode)) {
      $this->__log('ExportControl: WorkingMode not loaded', LOG_MESSAGE);
      return;
    }

    if ($workingMode !== $this->__solax->WorkingModeSelfUse) {
      $status = $this->__solax->setRegistryValue('WorkingMode', $this->__solax->WorkingModeSelfUse) ? 'set' : 'failure';
      $this->__log("ExportControl: WorkingMode '".SolaX::WORKING_MODES[$workingMode]."' -> 'WorkingModeSelfUse' - {$status}", LOG_CHANGE);
    }

    $hour = +date('G');
    if (21 < $hour || 5 > $hour) {
      $this->__log('ExportControl: stopped', LOG_MESSAGE);
      return; // Rizeni mezi 21. a 5. hodinou pozastaveno
    }

    $nextHour = +date('G', strtotime('+15 minutes'));
    if ($hour === $nextHour) {
      $this->__log('ExportControl: skipped', LOG_MESSAGE);
      return;
    }

    $filtered = array_filter($this->__prices['Data'], function ($item) use ($nextHour) {
      return $nextHour === $item['Hour'];
    });

    $price = 2 === count($filtered) ? $this->__getCorrectHour($filtered) : reset($filtered);
    if (!isset($price)) {
      $this->__log('ExportControl: prices not loaded', LOG_MESSAGE);
      return;
    }

    $registryValue = $this->__solax->getRegistryValue('ExportControl', false);
    if (!isset($registryValue)) {
      $this->__log('ExportControl: ExportControl value not loaded', LOG_MESSAGE);
      return;
    }

    $requiredValue = $export[$price['Allow'] ? 'OnValue' : 'OffValue'];
    if (!isset($requiredValue)) {
      $this->__log('ExportControl: Required value not loaded', LOG_MESSAGE);
      return;
    }

    $currentBias = $this->__solax->getRegistryValue('BiasMode', false);
    if ($currentBias !== $this->__solax->BiasModeDisabled) {
      $biasControl = 0 > $price['Price'] ? $this->__solax->BiasModeINV : $this->__solax->BiasModeGrid;
      if ($currentBias !== $biasControl) {
        $status = $this->__solax->setRegistryValue('BiasMode', $biasControl) ? 'set' : 'failure';
        $this->__log("ExportControl: Bias '".SolaX::BIAS_MODES[$currentBias]."' -> '".SolaX::BIAS_MODES[$biasControl]."' - {$status}", LOG_CHANGE);
      } else {
        $this->__log('ExportControl: Bias unchanged', LOG_MESSAGE);
      }
    }

    if ($registryValue !== $requiredValue) {
      $status = $this->__solax->setRegistryValue('ExportControl', $requiredValue) ? 'set' : 'failure';
      $this->__log("ExportControl: Export {$registryValue} W -> {$requiredValue} W - {$status}", LOG_CHANGE);
    } else {
      $this->__log('ExportControl: no change made', LOG_MESSAGE);
    }
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
   *  18°C ~  18,5 A
   *  19°C ~  21,5 A
   *  20°C ~  22,0 A
   *  21°C ~  22,2 A (*)
   * >21°C ~  25,0 A
   * >23°C ~ >25,0 A
   */
  private function __checkSmartCharge() {
    if (!$this->__isConfigSet($smartCharge = $this->__settings['SmartCharge'], ['HourEnd',  'HourStart', 'MinBatterySoC', 'MonthEnd', 'MonthStart', 'OffPVEPower', 'Status'])) {
      $this->__log('SmartCharge: invalid config', LOG_MESSAGE);
      return;
    }

    if (!$smartCharge['Status']) {
      $this->__log('SmartCharge: off', LOG_MESSAGE);
      return; // Rizeni vypnuto
    }

    $month = +date('n');
    if ($month < $smartCharge['MonthStart'] && $month > $smartCharge['MonthEnd']) { // Musi byt v danem rozsahu roku
      $this->__log('SmartCharge: not in months range', LOG_MESSAGE);
      return;
    }

    $nextTime = strtotime('+15 minutes');
    $nextHour = +date('G', $nextTime);
    $nextDate = date('Y-m-d', $nextTime);
    if ($nextHour < $smartCharge['HourStart'] && $nextHour > $smartCharge['HourEnd']) { // Musi byt ve spoustenem intervalu dne
      $this->__log('SmartCharge: not in hours range', LOG_MESSAGE);
      return;
    }

    $records = json_decode(file_get_contents(FILE_CHARGE), true);
    if (null === $records) {
      $this->__log('SmartCharge: file not loaded', LOG_MESSAGE);
      return;
    }

    $status = [
      'SmartCharge' => false,
      'WorkingMode' => false
    ];

    $record = [
      'Date'  => '0000-00-00',
      'Hour'  => -1,
      'Price' => 0
    ];
    foreach ($records as $chargePrice) {
      if ($nextDate === $chargePrice['Date'] && $nextHour === $chargePrice['Hour']) {
        $record = $chargePrice;
        break;
      }
    }

    $batterySoC = $this->__solax->getRealValue('BatteryRemainingCapacity', false, true);
    if ($batterySoC > $smartCharge['MinBatterySoC']) { // SoC aku musi byt nizsi nez MinBatterySoC
      $this->__log("SmartCharge: battery charged - {$batterySoC} %", LOG_MESSAGE);
      $this->__turnOffCharging($status);
      return;
    }

    $pvePower = $this->__solax->getRealValue('PV1Power', false) + $this->__solax->getRealValue('PV2Power', false);
    if ($pvePower >= $smartCharge['OffPVEPower']) { // Vykon nesmi byt vyssi nez OffPVEPower
      $this->__log("SmartCharge: too much PVE power - {$pvePower} W", LOG_MESSAGE);
      $this->__turnOffCharging($status);
      return;
    }

    if ($nextDate === $record['Date'] && $nextHour === $record['Hour']) { // Zapne nabijeni akumulatoru
      $sleep = 50;

      $workingMode = $this->__solax->getRegistryValue('WorkingMode', false, true);
      if ($workingMode !== $this->__solax->WorkingModeManual) { // Kontrola nastaveni manualu
        $status['WorkingMode'] = $this->__solax->setRegistryValue('WorkingMode', $this->__solax->WorkingModeManual);
        $statusText = $status['WorkingMode'] ? 'set' : 'failure';
        $this->__log("SmartCharge: Working mode '".SolaX::WORKING_MODES[$workingMode]."' -> 'WorkingModeManual' - {$statusText}", LOG_CHANGE);

        sleep(10); // 10s
        $sleep -= 10;
      }

      if ($status['WorkingMode']) {
        while ($this->__solax->RunModeNormal !== $this->__solax->getRealValue('RunMode', false, true)) {
          sleep(20);
          $sleep -= 20;
        }
      }

      $manualMode = $this->__solax->getRegistryValue('ManualModeCharging', false);
      if ($manualMode !== $this->__solax->ManualModeForceCharge) {
        if (0 < $sleep) {
          sleep($sleep);
        }

        $status['SmartCharge'] = $this->__solax->setRegistryValue('ManualModeCharging', $this->__solax->ManualModeForceCharge);
        $statusText = $status['SmartCharge'] ? 'set' : 'failure';
        $this->__log("SmartCharge: Manual mode '".SolaX::MANUAL_MODES[$manualMode]."' -> 'ManualModeForceCharge' - {$statusText}", LOG_CHANGE);
      }

      if ($status['WorkingMode'] && $status['SmartCharge']) {
        $this->__log("SmartCharge: Charge start - {$record['Date']} at {$record['Hour']}, SoC: {$batterySoC} %", LOG_CHANGE);
      }

      exit;
    }

    if (-1 === $record['Hour']) {
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
    if (!$this->__isConfigSet($settings = $this->__settings, ['Threshold']) ||
        !$this->__isConfigSet($export = $settings['Export'], ['OnValue', 'Status']) ||
        !$this->__isConfigSet($smartExport = $settings['SmartExport'], [
          'HourEnd', 'HoursBelowThreshold', 'HourStart', 'MinBatterySoC', 'MinPVEPower',
          'MonthEnd', 'MonthStart', 'PriceMultiplier', 'Status', 'UseNegativePrices'
        ])) {
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

    $nextHour = +date('G', strtotime('+15 minutes'));
    if ($nextHour < $smartExport['HourStart'] || $nextHour > $smartExport['HourEnd']) { // Musi byt ve spoustenem intervalu dne
      $this->__log('SmartExport: not in hours range', LOG_MESSAGE);
      return;
    }

    $pricesBelowThreshold = array_filter($this->__prices['Data'], function ($item) use ($smartExport) {
      return !$item['Allow'] && $item['Hour'] >= $smartExport['HourStart'] && $item['Hour'] <= $smartExport['HourEnd'];
    });
    if (count($pricesBelowThreshold) < $smartExport['HoursBelowThreshold']) { // Musi byt alespon pocet HoursBelowThreshold
      $this->__log('SmartExport: count not match', LOG_MESSAGE);
      return;
    }

    $filtered = array_filter($this->__prices['Data'], function ($item) use ($nextHour) {
      return $nextHour === $item['Hour'];
    });
    $price = reset($filtered);
    if (!isset($price) || !$price['Allow']) { // Cena OTE musi byt rentabilni
      $this->__log('SmartExport: price not profitable', LOG_MESSAGE);
      return;
    }

    $count = count($this->__prices['Data']);
    $averagePrice = 0 < $count ? array_reduce($this->__prices['Data'], function ($acc, $item) {
      return $acc + $item['Price'];
    }, 0) / $count : 0;
    $minAveragePrice = $this->__settings['Threshold'] * $smartExport['PriceMultiplier'];

    if ($averagePrice < $minAveragePrice) { // Denni prumer musi byt vyssi nez Threshold * PriceMultiplier
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

    $exportValue = $this->__solax->getRegistryValue('ExportControl', false, true);
    $workingMode = $this->__solax->getRegistryValue('WorkingMode', false);
    if (!isset($workingMode) || !isset($exportValue)) {
      $this->__log('SmartExport: neither ExportControl value nor Working mode loaded', LOG_MESSAGE);
      return;
    }

    // -> nastavime export na OnValue a WorkMode na FeedIn
    $status = [
      'ExportControl' => null,
      'WorkingMode'   => null
    ];

    if ($exportValue !== $export['OnValue']) {
      $status['ExportControl'] = $this->__solax->setRegistryValue('ExportControl', $onValue = $export['OnValue']);
      $statusText = $status['ExportControl'] ? 'set' : 'failure';
      $this->__log("SmartExport: Export {$exportValue} W -> {$onValue} W - {$statusText}", LOG_CHANGE);
    }

    if ($workingMode !== $this->__solax->WorkingModeFeedIn) {
      $status['WorkingMode'] = $this->__solax->setRegistryValue('WorkingMode', $this->__solax->WorkingModeFeedIn);
      $statusText = $status['WorkingMode'] ? 'set' : 'failure';
      $this->__log("SmartExport: WorkingMode '".SolaX::WORKING_MODES[$workingMode]."' -> 'WorkingModeFeedIn' - {$statusText}", LOG_CHANGE);
    }

    if (null === $status['ExportControl'] && null === $status['WorkingMode']) {
      $this->__log('SmartExport: no change made', LOG_MESSAGE);
      exit;
    }

    if ($status['ExportControl'] && $status['WorkingMode']) {
      exit; // zmeny zaznamenany, vse OK -> konec
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
    ($this->__verboseLevel & $level) && file_put_contents(FILE_OUTPUT, date('[c]')." {$message}\n", FILE_APPEND);
  }

  /**
   * Vypne nabijeni akumulatoru
   */
  private function __turnOffCharging(array &$status) {
    $workingMode = $this->__solax->getRegistryValue('WorkingMode', false, true);
    $manualMode = $this->__solax->getRegistryValue('ManualModeCharging', false);
    if ($workingMode === $this->__solax->WorkingModeManual || $manualMode === $this->__solax->ManualModeForceCharge) {
      sleep(50);

      $batterySoC = $this->__solax->getRealValue('BatteryRemainingCapacity', false, true);
      $this->__log("SmartCharge: charging ended, SoC: {$batterySoC} %", LOG_CHANGE);

      if ($manualMode === $this->__solax->ManualModeForceCharge) {
        $status['SmartCharge'] = $this->__solax->setRegistryValue('ManualModeCharging', $this->__solax->ManualModeChargingOff);
        $statusText = $status['SmartCharge'] ? 'set' : 'failure';
        $this->__log("SmartCharge: Manual mode '".SolaX::MANUAL_MODES[$manualMode]."' -> 'ManualModeChargingOff' - {$statusText}", LOG_CHANGE);
      }

      if ($workingMode === $this->__solax->WorkingModeManual) {
        $status['WorkingMode'] = $this->__solax->setRegistryValue('WorkingMode', $this->__solax->WorkingModeSelfUse);
        $statusText = $status['WorkingMode'] ? 'set' : 'failure';
        $this->__log("SmartCharge: Working mode '".SolaX::WORKING_MODES[$workingMode]."' -> 'WorkingModeSelfUse' - {$statusText}", LOG_CHANGE);
      }

      sleep(5);
    }
  }

}

/**
 * Vytvori instanci a spusti ji
 */
$trigger = new Trigger();
$trigger->run();
