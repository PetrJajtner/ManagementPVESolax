import {
  ApplicationConfig, inject, provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { APP_ROUTES } from '@app/app.routes';
import {
  APPLICATION_BUILD, APPLICATION_DATE, APPLICATION_NAME, APPLICATION_VERSION
} from '@app/app.settings';
import { APP_INFO, ConfigService, I18nService } from '@libs/shared';

/**
 * Konfigurace aplikace
 */
export const APP_CONFIG: ApplicationConfig = {
  providers: [
    {
      provide:  APP_INFO,
      useValue: {
        build:   APPLICATION_BUILD,
        date:    APPLICATION_DATE,
        name:    APPLICATION_NAME,
        version: APPLICATION_VERSION
      }
    },
    provideAppInitializer(async () => {
      const
        configSrv = inject<ConfigService>(ConfigService),
        i18nSrv = inject<I18nService>(I18nService)
      ;

      await configSrv.load();
      await i18nSrv.load();
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(APP_ROUTES)
  ]
};
