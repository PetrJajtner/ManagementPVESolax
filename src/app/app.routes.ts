import { Route, Routes } from '@angular/router';
import { HELP_ROUTES } from '@libs/help';
import { INDEX_ROUTES } from '@libs/index';
import { SETTINGS_ROUTES } from '@libs/settings';
import {
  ErrorComponent, ROUTE_PATH_HELP, ROUTE_PATH_INDEX, ROUTE_PATH_SETTINGS
} from '@libs/shared';

/**
 * Smerovani pri chybe
 */
export const ERROR_ROUTE: Route = {
  component: ErrorComponent,
  path:      '**'
};

/**
 * Smerovani na "Uvodni stranku"
 */
export const INDEX_ROUTE: Route = {
  children: INDEX_ROUTES,
  data:     {name: 'Index'},
  path:     ROUTE_PATH_INDEX
};

/**
 * Smerovani na "Napoveda"
 */
export const HELP_ROUTE: Route = {
  children: HELP_ROUTES,
  data:     {name: 'Help'},
  path:     ROUTE_PATH_HELP
};

/**
 * Smerovani na "Nastaveni"
 */
export const SETTINGS_ROUTE: Route = {
  children: SETTINGS_ROUTES,
  data:     {name: 'Settings'},
  path:     ROUTE_PATH_SETTINGS
};

/**
 * Dostupna smerovani aplikace
 */
export const APP_ROUTES: Routes = [
  // U smerovani zalezi na poradi
  INDEX_ROUTE,
  SETTINGS_ROUTE,
  HELP_ROUTE,
  // ErrorRoute musi byt jako posledni
  ERROR_ROUTE
];

/**
 * Smerovani hlavniho menu
 * POZOR!!! Zalezi na poradi
 */
export const MAIN_MENU_ROUTES: Routes = [
  INDEX_ROUTE,
  SETTINGS_ROUTE,
  HELP_ROUTE
];

/**
 * Smerovani vedlejsiho menu
 * POZOR!!! Zalezi na poradi
 */
export const SUB_MENU_ROUTES: Routes = [];
