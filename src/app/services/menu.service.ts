import { Location } from '@angular/common';
import { Injectable, Signal, computed, effect, inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { MAIN_MENU_ROUTES, SUB_MENU_ROUTES } from '@app/app.routes';
import { ROUTE_PATH_INDEX } from '@libs/shared';

/**
 * Nabidka
 */
export type Menu = {
  main: Routes;
  path: string;
  sub?: Routes;
};

/**
 * Sluzba pro vytvoreni (prip. pro prizpusobeni) nabidky
 */
@Injectable({
  providedIn: 'root'
})
export class MenuService {

  /**
   * Sluzba pro interakci s adresou URL prohlizece
   */
  private __location: Location = inject<Location>(Location);

  /**
   * Smerovac
   */
  private __router: Router = inject<Router>(Router);

  /**
   * Posledni znama cesta
   */
  private __lastPath: string = this.__location.path();

  /**
   * Signal finalni nabidky
   */
  private __menuSg: Signal<Menu> = computed<Menu>(() => {
    const menu: Menu = {
      main: this.__filterRoutes(MAIN_MENU_ROUTES),
      path: this.__lastPath
    };

    if (SUB_MENU_ROUTES.length) {
      menu.sub = this.__filterRoutes(SUB_MENU_ROUTES);
    }

    return menu;
  });

  /**
   * Getter signalu finalni nabidky
   */
  public get menuSg(): Signal<Menu> {
    return this.__menuSg;
  }

  /**
   * Konstruktor
   */
  public constructor() {

    /**
     * Efekt pro navigaci po zmene menu
     */
    effect(() => {
      const menu = this.__menuSg();
      setTimeout(() => {
        void this.__router.navigateByUrl(menu.path, {onSameUrlNavigation: 'reload'});
        this.__lastPath = ROUTE_PATH_INDEX;
      });
    });
  }

  /**
   * Dle LoadGuardu vyfiltruje povolene routy
   */
  private __filterRoutes(routes: Routes): Routes {
    return routes;
  }

}
