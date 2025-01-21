<?php

/**
 * Pocet desetinnych mist
 */
const DECIMAL_PLACES = 2;

/**
 * Soubor JSON s nejnizsi cenou pro nabijeni
 */
const FILE_CHARGE = __DIR__ . '/data/charge.json';

/**
 * Textovy vystup s informacemi o zmenach
 */
const FILE_OUTPUT = __DIR__ . '/data/output.txt';

/**
 * Soubor JSON se zitrejsimi cenami OTE
 */
const FILE_PREDICTION = __DIR__ . '/data/prediction.json';

/**
 * Soubor JSON s dnesnimi cenami OTE
 */
const FILE_PRICES = __DIR__ . '/data/prices.json';

/**
 * Soubor JSON s nastavenim rizeni
 */
const FILE_SETTINGS = __DIR__ . '/data/settings.json';

/**
 * Casove pasmo
 */
const TIMEZONE = 'Europe/Prague';

/**
 * Nastavi casovou zonu
 */
date_default_timezone_set(TIMEZONE);

/**
 * Nastavi limit zpracovani
 */
set_time_limit(900); // 15 min.
