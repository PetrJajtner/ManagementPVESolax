<?php

require_once __DIR__.'/constants.php';

$action = $_REQUEST['action'];
$method = $_SERVER['REQUEST_METHOD'];

if ('charge' === $action) {
  if ('GET' === $method) {
    header(CONTENT_JSON_TYPE);
    readfile(FILE_CHARGE);
    exit;
  }
  if ('POST' === $method) {
    $verbose = isset($_REQUEST['verbose']);
    $data = readJSON(PHP_INPUT);
    if (!isset($data['date']) || !isset($data['item'])) {
      header(HTTP_400);
      exit;
    }

    $file = date('Y-m-d') === $data['date'] ? FILE_PRICES : FILE_PREDICTION;
    $records = readJSON($file);
    if (!isset($records['Date']) || !isset($data['date']) || $records['Date'] !== $data['date']) {
      header(HTTP_500);
      if ($verbose) {
        echo 'Prices not loaded or date does not match';
      }
      exit;
    }

    $record = [];
    foreach ($records['Data'] as &$item) {
      if ($data['item']['Time'] === $item['Time']) {
        $charge = isset($data['item']['Charge']) ? !$data['item']['Charge'] : true;
        if ($charge) {
          $item['Charge'] = true;
        } else {
          unset($item['Charge']);
        }
        $record = $item;
        break;
      }
    }

    if (0 < count($record) && false !== saveJSON($file, $records)) {
      echoJSON($record, false);
    } else {
      header(HTTP_500);
      if ($verbose) {
        echo 'Price record does not match or saving failure';
      }
    }
    exit;
  }
}

if ('connection' === $action && 'POST' === $method) {
  require_once CLASS_INVERTER;

  $config = readJSON(PHP_INPUT);
  $solax = new SolaX($config);
  $data = $solax->readVersion();

  echoJSON(['Success' => 0 < count($data)]);
}

if ('live-data' === $action) {
  setSSEHeaders();

  $charge = [];
  $data = [];
  $dataId = $lastDataId = -1;
  $fileId = $lastFileId = -1;
  $isESP = isset($_REQUEST['esp']);

  SensorsSM::Init();
  while (!connection_aborted()) {
    if (null !== ($sensorsData = SensorsSM::Read(SHARED_MEMORY_KEY_SENSORS))) {
      ['Id' => $dataId, 'Data' => $data] = $sensorsData;
    }
    if (null !== ($chargeData = SensorsSM::Read(SHARED_MEMORY_KEY_CHARGE))) {
      ['Id' => $fileId, 'Charge' => $charge] = $chargeData;
    }

    if ($lastDataId !== $dataId) {
      if ($isESP) {
        $data['Sleep'] = getInterval(true) * 1000; // v ms
      }

      $lastDataId = $dataId;
      $msg = json_encode($data);

      echo "id: {$dataId}\n";
      echo "event: data\n";
      echo "data: {$msg}\n\n";

      ob_flush();
      flush();
    }
    if ($lastFileId !== $fileId) {
      $lastFileId = $fileId;
      $msg = json_encode($charge);

      echo "id: {$fileId}\n";
      echo "event: charge\n";
      echo "data: {$msg}\n\n";

      ob_flush();
      flush();
    }

    usleep(5e5); // 0,5s
  }
  SensorsSM::Done();

  exit;
}

if ('output' === $action) {
  if ('DELETE' === $method) {
    if (false === file_put_contents(FILE_OUTPUT, '')) {
      header(HTTP_500);
    }
    exit;
  }
  if ('PATCH' === $method) { /* promaze obsah vystupu a pouzije metodu GET */
    $lines = array_slice(file(FILE_OUTPUT, FILE_IGNORE_NEW_LINES), -MIN_OUTPUT_LINES);
    if (false === file_put_contents(FILE_OUTPUT, implode(PHP_EOL, $lines).PHP_EOL)) {
      header(HTTP_500);
      exit;
    }
    $method = 'GET';
  }
  if ('GET' === $method) {
    header('Content-type: text/plain; charset="UTF-8"');
    readfile(FILE_OUTPUT);
    exit;
  }
}

if ('prediction' === $action && 'GET' === $method) {
  header(CONTENT_JSON_TYPE);
  readfile(FILE_PREDICTION);
  exit;
}

if ('prices' === $action && 'GET' === $method) {
  header(CONTENT_JSON_TYPE);
  readfile(FILE_PRICES);
  exit;
}

if ('real-data' === $action) {
  $data = [];
  $date = date('c');
  $id = -1;

  SensorsSM::Init();
  do {
    if (null !== ($sensorsData = SensorsSM::Read(SHARED_MEMORY_KEY_SENSORS))) {
      ['Id' => $id, 'Data' => $data] = $sensorsData;
    }
    if (isset($data['Date']) && $data['Date'] > $date) {
      $data['Id'] = $id;
      break;
    }
    usleep(5e5); // 0,5s
  } while (true);
  SensorsSM::Done();

  if (isset($_REQUEST['esp'])) {
    $data['Sleep'] = getInterval(true) * 1000; // v ms
  }

  echoJSON($data);
}

if ('registry' === $action) {
  require_once CLASS_INVERTER;

  $settings = readJSON(FILE_SETTINGS);
  $solax = new SolaX($settings);

  if ('GET' === $method) {
    echoJSON($solax->readSetData(null, null));
  }

  if ('POST' === $method) {
    $data = readJSON(PHP_INPUT);
    $original = $solax->readSetData(null, null);

    $modified = array();
    foreach ($data as $key => $measurement) {
      if ($measurement['value'] !== $original[$key]['value']) {
        $modified[$key] = $measurement['value'];
      }
    }

    $result = true;
    foreach ($modified as $key => $value) {
      $from = $original[$key]['value'];
      $to = $value;
      $unit = $original[$key]['unit'] ? " {$original[$key]['unit']}" : '';

      if (false !== stripos($key, 'mode')) {
        $from = $solax->getMode($key, $from);
        $to = $solax->getMode($key, $to);
      }

      file_put_contents(FILE_OUTPUT, date('[c]')." Setting registry key \"{$key}\": {$from}{$unit} -> {$to}{$unit}".PHP_EOL, FILE_APPEND | LOCK_EX);
      $result = $result && $solax->setRegistryValue($key, $value);
    }

    echoJSON(['Success' => $result]);
  }
}

if ('settings' === $action) {
  if ('GET' === $method) {
    header(CONTENT_JSON_TYPE);
    readfile(FILE_SETTINGS);
    exit;
  }

  if ('POST' === $method) {
    $original = readJSON(FILE_SETTINGS);
    $data = readJSON(PHP_INPUT);
    $result = false !== saveJSON(FILE_SETTINGS, $data, LOCK_EX);

    echoJSON(['Success' => $result], false);
    if (($data['Threshold'] !== $original['Threshold']) || ($data['MeteringInterval'] !== $original['MeteringInterval'])) {
      require_once __DIR__.'/parser.php';
    }

    exit;
  }
}

if ('temperature' === $action && 'GET' === $method) {
  $date = date('c');
  $id = -1;
  $temperatures = [];

  SensorsSM::Init();
  if (null !== ($sensorsData = SensorsSM::Read(SHARED_MEMORY_KEY_SENSORS))) {
    $id = $sensorsData['Id'];
    ['Date' => $date, 'RadiatorTemperature' => $outer, 'RadiatorTemperatureInner' => $inner] = $sensorsData['Data'];

    $temperatures['RadiatorTemperature'] = $outer['value'];
    $temperatures['RadiatorTemperatureInner'] = $inner['value'];
  }
  SensorsSM::Done();

  $data = array_merge($temperatures, [
    'Date'       => $date,
    'Id'         => $id,
    'Interval'   => getInterval(),
    'ShowOnRead' => SHOW_ON_READ,
    'Threshold'  => INVERTER_TEMPERATURE_THRESHOLD
  ]);

  echoJSON($data);
}

if ('thermo' === $action && 'GET' === $method) {
  setSSEHeaders();

  $lastInner = $lastOuter = $lastTime = 0;
  $id = $tInner = $tOuter = -1;
  $date = date('c');

  SensorsSM::Init();
  while (!connection_aborted()) {
    if (null !== ($sensorsData = SensorsSM::Read(SHARED_MEMORY_KEY_SENSORS))) {
      $id = $sensorsData['Id'];
      ['Date' => $date, 'RadiatorTemperature' => $outer, 'RadiatorTemperatureInner' => $inner] = $sensorsData['Data'];

      $tOuter = $outer['value'];
      $tInner = $inner['value'];
    }

    $seconds = getInterval();
    $now = time();

    if (isset($tOuter, $tInner) && ($tInner !== $lastInner || $tOuter !== $lastOuter || ($now > $seconds + $lastTime))) {
      $lastInner = $tInner;
      $lastOuter = $tOuter;
      $lastTime = $now;

      $msg = json_encode([
        'Date'                     => $date,
        'Id'                       => $id,
        'Interval'                 => $seconds,
        'RadiatorTemperature'      => $lastOuter,
        'RadiatorTemperatureInner' => $lastInner,
        'ShowOnRead'               => SHOW_ON_READ,
        'Threshold'                => INVERTER_TEMPERATURE_THRESHOLD
      ]);

      if (null != $lastOuter) {
        echo "id: {$lastTime}\n";
        echo "event: data\n";
        echo "data: {$msg}\n\n";

        ob_flush();
        flush();
      }
    }

    sleep($seconds / 3);
  }
  SensorsSM::Done();

  exit;
}

if ('versions' === $action && 'GET' === $method) {
  require_once CLASS_INVERTER;

  $settings = readJSON(FILE_SETTINGS);
  $solax = new SolaX($settings);
  $data = $solax->readVersion();

  echoJSON($data);
}

header(HTTP_400);
exit;
