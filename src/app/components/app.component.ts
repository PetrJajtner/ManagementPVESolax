import {
  ChangeDetectionStrategy, Component, ElementRef, HostBinding, Signal, computed,
  effect, inject, isDevMode, signal
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute, NavigationCancel, NavigationEnd, NavigationError,
  NavigationStart, Router, Event as RouterEvent
} from '@angular/router';
import { APPLICATION_NAME } from '@app/app.settings';
import { API } from '@app/models/urls.model';
import { isObject } from '@app/models/utils.model';
import { ConfigService, Theme } from '@app/services/config.service';
import { I18nService } from '@app/services/i18n.service';
import { Menu, MenuService } from '@app/services/menu.service';
import { WaitService } from '@app/services/wait.service';

/**
 * CSS trida pro nacitani
 */
const CSS_CLASS_WAIT = 'wait';

/**
 * Titulek
 */
type PageTitle = {
  caption?: string; // Nazev beze zmen
  label?:   string; // Prekladany nazev
};

/**
 * Komponenta aplikace
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector:        'body',
  standalone:      false,
  templateUrl:     './app.component.html'
})
export class AppComponent {

  /**
   * Aktualni smerovani
   */
  private __activatedRoute: ActivatedRoute = inject(ActivatedRoute);

  /**
   * Smerovac
   */
  private __router: Router = inject(Router);

  /**
   * Sluzba pro nacteni konfigurace aplikace
   */
  private __configSrv: ConfigService = inject(ConfigService);

  /**
   * Sluzba zajistujici lokalizaci aplikace
   */
  private __i18nSrv: I18nService = inject(I18nService);

  /**
   * Sluzba pro vytvoreni (prip. pro prizpusobeni) nabidky
   */
  private __menuSrv: MenuService = inject(MenuService);

  /**
   * Sluzba pro vyckavani
   */
  private __waitSrv: WaitService = inject(WaitService);

  /**
   * Element tela
   */
  private __body: HTMLBodyElement = inject<ElementRef<HTMLBodyElement>>(ElementRef<HTMLBodyElement>).nativeElement;

  /**
   * Signal ukonceni navigace
   */
  private __navigationEndSg: Signal<NavigationEnd | undefined> = computed<NavigationEnd | undefined>(() => {
    const routerEvent = this.__routerEventSg();
    return routerEvent instanceof NavigationEnd ? routerEvent : undefined;
  });

  /**
   * Signal titulku stranky
   */
  private __pageTitleSg: Signal<PageTitle | undefined> = computed(() => {
    this.__navigationEndSg();
    return this.__getPageTitle();
  });

  /**
   * Signal aktualni cesty
   */
  private __pathSg: Signal<string | undefined> = computed(() => {
    const
      url = this.__navigationEndSg()?.url ?? this.__router.url,
      parts = `${url ? url : ''}`.replace(/^\//, '').split(/\/|\?/)
    ;
    return 0 < parts.length ? parts[0] : '';
  });

  /**
   * Signal nazvu projektu
   */
  private __projectSg: Signal<string> = signal<string>(APPLICATION_NAME).asReadonly();

  /**
   * Signal udalosti smerovace
   */
  private __routerEventSg: Signal<RouterEvent | undefined> = toSignal(this.__router.events);

  /**
   * Signal pro nastaveni titulku stranky
   */
  private __titleSg: Signal<string | undefined> = computed(() => {
    const
      pageTitle = this.__pageTitleSg(),
      language = this.__i18nSrv.languageSg()
    ;
    if (language && pageTitle) {
      return this.__buildDocumentTitle(pageTitle);
    }
    return undefined;
  });

  /**
   * Getter signalu finalni nabidky
   */
  public get menuSg(): Signal<Menu> {
    return this.__menuSrv.menuSg;
  }

  /**
   * Getter signalu aktualni cesty
   */
  public get pathSg(): Signal<string | undefined> {
    return this.__pathSg;
  }

  /**
   * Getter signalu nazvu projektu
   */
  public get projectSg(): Signal<string> {
    return this.__projectSg;
  }

  /**
   * Getter barevneho tematu
   */
  @HostBinding('class')
  public get theme(): Theme {
    return this.__configSrv.themeSg();
  }

  /**
   * Getter priznaku vyckavaci
   */
  @HostBinding(`class.${CSS_CLASS_WAIT}`)
  public get wait(): boolean {
    return this.__waitSrv.waitSg();
  }

  /**
   * Konstruktor
   */
  public constructor() {
    !isDevMode() && this.__body.removeAttribute('ng-version');

    console.log(
      '%c Zadržte! / Hold on! \n%c Tato funkce prohlížeče je určena pro vývojáře. / This browser feature is intended for developers. ',
      'color: #f00; font-family: sans-serif; font-size: 28px; font-weight: bold;',
      'color: #666; font-family: sans-serif; font-size: 20px;'
    );

    /**
     * Nastavi cestu k data serveru
     */
    effect(() => {
      const config = this.__configSrv.configSg();
      config?.DataServerUrl && (API.Path = config.DataServerUrl);
    });

    /**
     * Nastavi titulek
     */
    effect(() => {
      this.__i18nSrv.languageSg() && this.__titleSg();
    });

    /**
     * Efekt pro nastaveni titulku stranky (v zalozce)
     */
    effect(() => {
      const routerEvent = this.__routerEventSg();
      if (undefined === routerEvent) {
        return;
      }

      setTimeout(() => this.__checkRouterEvent(routerEvent));
    });
  }

  /**
   * Sestavi titulek stranky
   */
  private __buildDocumentTitle(title: PageTitle = {}): string {
    const name = this.__i18nSrv.translate('ApplicationName');

    let page = '';
    if (isObject(title)) {
      if ('caption' in title) {
        page = title.caption ?? '';
      } else if ('label' in title) {
        page = (title.label && this.__i18nSrv.translate(title.label)) || '';
      }
      page = `${name}${page ? ' – ' + page : ''}`;
    }

    if (page && document.title !== page) {
      document.title = page;
    }

    return document.title;
  }

  /**
   * Presypaci hodiny dle udalosti routeru
   */
  private __checkRouterEvent(event: RouterEvent): void {
    if (event instanceof NavigationStart) {
      this.__waitSrv.wait = true;
    }
    if (event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError) {
      this.__waitSrv.wait = false;
    }
  }

  /**
   * Z aktualni trasy zjisti titulek stranky
   */
  private __getPageTitle(route: ActivatedRoute = this.__activatedRoute): PageTitle {
    while (route) {
      if (route.firstChild) {
        route = route.firstChild;
      } else {
        break;
      }
    }

    if (route.snapshot && route.snapshot.data) {
      const
        params = {...route.snapshot.params, ...route.snapshot.queryParams},
        name = ('name' in route.snapshot.data ? route.snapshot.data['name'] : '') as string,
        translationId = ('translate' in route.snapshot.data ? route.snapshot.data['translate'] : '') as string
      ;

      let key = name in params ? 'caption' : 'label';
      if (translationId) {
        key = 'label';
      }

      const value = (name in params ? params[name] : name) as string;
      return {[key]: value};
    }

    return {};
  }

}
