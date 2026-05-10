import { Route, Routes } from '@angular/router';
import { IndexComponent } from './components/index.component';

/**
 * Vychozi smerovani
 */
const INDEX_ROUTE: Route = {
  component: IndexComponent,
  path:      ''
};

/**
 * Smerovani modulu
 */
export const INDEX_ROUTES: Routes = [
  INDEX_ROUTE
];
