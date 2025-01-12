import { NgModule } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { IndexComponent } from '@settings/components/index.component';

/**
 * Vychozi smerovani
 */
export const INDEX_ROUTE: Route = {
  component: IndexComponent,
  path:      ''
};

/**
 * Smerovani modulu
 */
export const SETTINGS_ROUTES: Routes = [
  INDEX_ROUTE
];

/**
 * Komponenty smerovace
 */
export const ROUTER_COMPONENTS = [
  IndexComponent
];

/**
 * Smerovac modulu Nastaveni
 */
@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forChild(SETTINGS_ROUTES)
  ]
})
export class SettingsRoutingModule {
}
