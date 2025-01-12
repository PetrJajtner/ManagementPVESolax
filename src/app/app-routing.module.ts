import { NgModule } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { ErrorComponent } from '@app/components/error/error.component';
import * as Paths from '@app/models/paths.model';
import { HELP_ROUTES } from '@help/help-routing.module';
import { INDEX_ROUTES } from '@index/index-routing.module';
import { SETTINGS_ROUTES } from '@settings/settings-routing.module';

/**
 * Smerovani pri chybe
 */
export const ERROR_ROUTE: Route = {
  component: ErrorComponent,
  path:      '**'
};

/**
 * Smerovani na „Uvodni stranku“
 */
export const INDEX_ROUTE: Route = {
  children: INDEX_ROUTES,
  data:     {name: 'Index'},
  path:     Paths.ROUTE_PATH_INDEX
};

/**
 * Smerovani na „Napoveda“
 */
export const HELP_ROUTE: Route = {
  children: HELP_ROUTES,
  data:     {name: 'Help'},
  path:     Paths.ROUTE_PATH_HELP
};

/**
 * Smerovani na „Nastaveni“
 */
export const SETTINGS_ROUTE: Route = {
  children: SETTINGS_ROUTES,
  data:     {name: 'Settings'},
  path:     Paths.ROUTE_PATH_SETTINGS
};

/**
 * Dostupna smerovani aplikace
 */
export const APPLICATION_ROUTES: Routes = [
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

/**
 * Komponenty smerovace
 */
export const ROUTER_COMPONENTS = [
  ErrorComponent
];

/**
 * Aplikacni smerovac
 */
@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forRoot(APPLICATION_ROUTES)
  ]
})
export class AppRoutingModule {
}
