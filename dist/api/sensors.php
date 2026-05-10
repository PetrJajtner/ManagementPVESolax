#!/usr/bin/php
<?php

declare(strict_types=1);

require_once __DIR__.'/constants.php';
set_time_limit(0); // neukoncovat

// Inicializace sdilene pameti
if (!SensorsSM::Init()) {
  fwrite(STDERR, "IPC init failed".PHP_EOL);
  exit(1);
}

echo "Sensor daemon started, v1.8".PHP_EOL;

// Ciste vypnuti
$shutdown = function() {
  SensorsSM::Done();
  exit;
};
pcntl_async_signals(true);
pcntl_signal(SIGTERM, $shutdown);
pcntl_signal(SIGINT, $shutdown);

// Inicializace senzoru SolaX
require_once CLASS_INVERTER;

$settings = readJSON(FILE_SETTINGS);
$solax = new SolaX($settings);

$id = $lastTime = 0;
$period = 5; // 5 s
$charge = [];
$control = [];
$threshold = [
  'RadiatorTemperatureThreshold' => [
    'value' => INVERTER_TEMPERATURE_THRESHOLD,
    'unit'  => '°C'
  ]
];

while (true) {
  $start = microtime(true);
  if (0 === ($id % 20)) { // cca 1,5 min. -> nove nacteni registru
    $control = $solax->readSetData(null, null);
  }

  clearstatcache(true, FILE_CHARGE);
  $currentTime = filemtime(FILE_CHARGE);
  if ($currentTime > $lastTime) {
    $charging = readJSON(FILE_CHARGE);
    $charge = isset($charging['Data']) && is_array($charging['Data']) && 0 < count($charging['Data']) ? $charging['Data'] : [];
    $lastTime = $currentTime;
  }

  $data = array_merge(
    ['Date' => date('c')],
    $solax->readRealData(null, null),
    $control,
    $threshold
  );

  // AccumulationData::Check($data);
  SensorsSM::Write(['Id' => $id++, 'Data' => $data], SHARED_MEMORY_KEY_SENSORS);
  SensorsSM::Write(['Id' => $lastTime, 'Charge' => $charge], SHARED_MEMORY_KEY_CHARGE);

  usleep((int) (($period * 1e6) - (microtime(true) - $start)));
}
