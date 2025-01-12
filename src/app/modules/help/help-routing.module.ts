import { NgModule } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { IndexComponent } from '@help/components/index.component';

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
export const HELP_ROUTES: Routes = [
  INDEX_ROUTE
];

/**
 * Komponenty smerovace
 */
export const ROUTER_COMPONENTS = [
  IndexComponent
];

/**
 * Smerovac modulu Napoveda
 */
@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forChild(HELP_ROUTES)
  ]
})
export class HelpRoutingModule {
}
