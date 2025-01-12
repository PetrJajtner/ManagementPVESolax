import { NgModule } from '@angular/core';
import { Route, RouterModule, Routes } from '@angular/router';
import { IndexComponent } from '@index/components/index.component';

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
export const INDEX_ROUTES: Routes = [
  INDEX_ROUTE
];

/**
 * Komponenty smerovace
 */
export const ROUTER_COMPONENTS = [
  IndexComponent
];

/**
 * Smerovac modulu Index
 */
@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forChild(INDEX_ROUTES)
  ]
})
export class IndexRoutingModule {
}
