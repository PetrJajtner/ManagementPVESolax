<?php

require_once __DIR__ . '/constants.php';

$action = $_REQUEST['action'];
$method = $_SERVER['REQUEST_METHOD'];

if ('charge' === $action && 'GET' === $method) {
  header('Content-type: application/json; charset="UTF-8"');
  readfile(FILE_CHARGE);
  exit;
}

if ('connection' === $action && 'POST' === $method) {
  require_once CLASS_INVERTER;

  $config = json_decode(file_get_contents('php://input'), true);
  $solax = new SolaX($config);
  $data = $solax->readVersion();

  header('Content-type: application/json; charset="UTF-8"');
  echo toJSON(['Success' => 0 < count($data)]);

  exit;
}

if ('live-data' === $action) {
  require_once CLASS_INVERTER;

  $settings = json_decode(file_get_contents(FILE_SETTINGS), true);
  $solax = new SolaX($settings);

  ini_set('output_buffering', 'off');
  ob_implicit_flush(true);
  ignore_user_abort(true);

  header('Content-Type: text/event-stream');
  header('Cache-Control: no-cache');
  header('Connection: keep-alive');
  header('Access-Control-Allow-Origin: *');

  $id = -1;
  $control = [];
  while (!connection_aborted()) {
    if (0 === (++$id % 10)) { // cca. 1,5 min. -> nove nacteni
      $control = $solax->readSetData(null, null);
    }

    $data = array_merge($solax->readRealData(null, null), $control, ['Date' => date('c')]);
    $msg = json_encode($data);

    echo "id: {$id}\n";
    echo "event: data\n";
    echo "data: {$msg}\n\n";

    ob_flush();
    flush();

    sleep(10); // 10s
  }
  exit;
}

if ('output' === $action) {
  if ('DELETE' === $method) {
    if (false === file_put_contents(FILE_OUTPUT, '')) {
      header('HTTP/1.1 500 Internal Server Error');
    }
    exit;
  }
  if ('PATCH' === $method) { /* promaze obsah vystupu a pouzije metodu GET */
    $lines = array_slice(file(FILE_OUTPUT, FILE_IGNORE_NEW_LINES), -MIN_OUTPUT_LINES);
    if (false === file_put_contents(FILE_OUTPUT, implode(PHP_EOL, $lines).PHP_EOL)) {
      header('HTTP/1.1 500 Internal Server Error');
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
  header('Content-type: application/json; charset="UTF-8"');
  readfile(FILE_PREDICTION);
  exit;
}

if ('prices' === $action && 'GET' === $method) {
  header('Content-type: application/json; charset="UTF-8"');
  readfile(FILE_PRICES);
  exit;
}

if ('registry' === $action) {
  require_once CLASS_INVERTER;

  $settings = json_decode(file_get_contents(FILE_SETTINGS), true);
  $solax = new SolaX($settings);

  if ('GET' === $method) {
    header('Content-type: application/json; charset="UTF-8"');
    echo toJSON($solax->readSetData(null, null));
    exit;
  }

  if ('POST' === $method) {
    $data = json_decode(file_get_contents('php://input'), true);
    $original = $solax->readSetData(null, null);

    $modified = array();
    foreach ($data as $key => $measurement) {
      if ($measurement['value'] !== $original[$key]['value']) {
        $modified[$key] = $measurement['value'];
      }
    }

    $date = date('c');
    $result = true;
    foreach ($modified as $key => $value) {
      $from = $original[$key]['value'];
      $to = $value;
      $unit = $original[$key]['unit'] ? " {$original[$key]['unit']}" : '';

      if (false !== stripos($key, 'mode')) {
        $from = $solax->getMode($key, $from);
        $to = $solax->getMode($key, $to);
      }

      file_put_contents(FILE_OUTPUT, "[{$date}] Setting registry key \"{$key}\": {$from}{$unit} -> {$to}{$unit}\n", FILE_APPEND);
      $result = $result && $solax->setRegistryValue($key, $value);
    }

    header('Content-type: application/json; charset="UTF-8"');
    echo toJSON(['Success' => $result]);

    exit;
  }
}

if ('settings' === $action) {
  if ('GET' === $method) {
    header('Content-type: application/json; charset="UTF-8"');
    readfile(FILE_SETTINGS);
    exit;
  }

  if ('POST' === $method) {
    $original = json_decode(file_get_contents(FILE_SETTINGS), true);
    $data = json_decode(file_get_contents('php://input'), true);
    $json = toJSON($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = false !== file_put_contents(FILE_SETTINGS, $json, LOCK_EX);

    header('Content-type: application/json; charset="UTF-8"');
    echo toJSON(['Success' => $result]);

    if ($data['Threshold'] !== $original['Threshold']) {
      require_once __DIR__.'/parser.php';
    }

    exit;
  }
}

if ('versions' === $action && 'GET' === $method) {
  require_once CLASS_INVERTER;

  $settings = json_decode(file_get_contents(FILE_SETTINGS), true);
  $solax = new SolaX($settings);

  header('Content-type: application/json; charset="UTF-8"');
  $data = $solax->readVersion();
  echo toJSON($data);
  exit;
}

header('HTTP/1.1 400 Bad Request');
exit;
