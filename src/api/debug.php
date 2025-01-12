<?php

/**
 * Chybova hlaseni
 */
error_reporting(E_ALL);
ini_set('display_errors', 'on');

/**
 * Funkce pro ladeni
 */
function debug($var, $types = false, $exit = true) {
  echo "<pre>";
  $types ? var_dump($var) : print_r($var);
  if ($exit) {
    exit;
  }
}
