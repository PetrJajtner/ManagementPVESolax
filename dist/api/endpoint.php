<?php

require_once __DIR__ . '/constants.php';

$action = $_REQUEST['action'];
$method = $_SERVER['REQUEST_METHOD'];

if ('connection' === $action && 'POST' === $method) {
  require_once __DIR__ . '/inverters/solax.php';

  $config = json_decode(file_get_contents('php://input'), true);
  $solax = new SolaX($config);
  $data = $solax->readVersion();

  header('Content-type: application/json; charset="UTF-8"');
  echo json_encode((object) ['Success' => 0 < count($data)], JSON_PRETTY_PRINT) . "\n";

  exit;
}

if ('live-data' === $action) {
  require_once __DIR__ . '/inverters/solax.php';

  $settings = json_decode(file_get_contents(FILE_SETTINGS), true);
  $solax = new SolaX($settings);

  ob_implicit_flush(true);

  header('Content-Type: text/event-stream');
  header('Cache-Control: no-cache');
  header('Connection: keep-alive');
  header('Access-Control-Allow-Origin: *');

  $id = 0;
  $control = $solax->readSetData(null, null);
  while (!connection_aborted()) {
    if (++$id === 25) { // cca. 5 min. -> nove spojeni
      $control = $solax->readSetData(null, null);
      $id = 0;
    }

    $data = array_merge($solax->readRealData(null, null), $control, ['Date' => date('c')]);
    $msg = json_encode($data);

    echo "event: data\n";
    echo "data: {$msg}\n\n";

    ob_flush();
    flush();

    sleep(10); // 10s
  }
  exit;
}

if ('prediction' === $action && 'GET' === $method) {
  $_REQUEST['json'] = true;
  $_REQUEST['1'] = true;
  require_once __DIR__.'/parser.php';
  exit;
}

if ('prices' === $action && 'GET' === $method) {
  header('Content-type: application/json; charset="UTF-8"');
  readfile(FILE_PRICES);
  exit;
}

if ('registry' === $action) {
  require_once __DIR__ . '/inverters/solax.php';

  $settings = json_decode(file_get_contents(FILE_SETTINGS), true);
  $solax = new SolaX($settings);

  if ('GET' === $method) {
    header('Content-type: application/json; charset="UTF-8"');
    $data = $solax->readSetData(null, null);
    echo json_encode($data);
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
    echo json_encode((object) ['Success' => $result], JSON_PRETTY_PRINT) . "\n";

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
    $json = str_replace('    ', '  ', json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) . "\n";
    $result = false !== file_put_contents(FILE_SETTINGS, $json, LOCK_EX);

    header('Content-type: application/json; charset="UTF-8"');
    echo json_encode((object) ['Success' => $result], JSON_PRETTY_PRINT) . "\n";

    if ($data['Threshold'] !== $original['Threshold']) {
      require_once __DIR__.'/parser.php';
    }

    exit;
  }
}

if ('versions' === $action && 'GET' === $method) {
  require_once __DIR__ . '/inverters/solax.php';

  $settings = json_decode(file_get_contents(FILE_SETTINGS), true);
  $solax = new SolaX($settings);

  header('Content-type: application/json; charset="UTF-8"');
  $data = $solax->readVersion();
  echo str_replace('    ', '  ', json_encode($data, JSON_PRETTY_PRINT)) . "\n";
  exit;
}

header('HTTP/1.1 400 Bad Request');
exit;
