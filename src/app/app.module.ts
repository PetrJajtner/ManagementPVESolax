import { ApplicationRef, DoBootstrap, NgModule, inject } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule, ROUTER_COMPONENTS } from '@app/app-routing.module';
import { AppComponent } from '@app/components/app.component';
import { ConfigService } from '@app/services/config.service';
import { I18nService } from '@app/services/i18n.service';
import { HelpModule } from '@help/help.module';
import { IndexModule } from '@index/index.module';
import { SettingsModule } from '@settings/settings.module';
import { SharedModule } from '@shared/shared.module';

/**
 * Modul aplikace „Rizení FVE Solax“
 */
@NgModule({
  declarations: [
    AppComponent,
    ...ROUTER_COMPONENTS
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HelpModule,
    IndexModule,
    SettingsModule,
    SharedModule
  ]
})
export class AppModule implements DoBootstrap {

  /**
   * Sluzba pro nacteni konfigurace aplikace
   */
  private __configSrv: ConfigService = inject(ConfigService);

  /**
   * Sluzba zajistujici lokalizaci aplikace
   */
  private __i18nSrv: I18nService = inject(I18nService);

  /**
   * Rutiny pro zavedeni aplikace
   */
  public ngDoBootstrap(appRef: ApplicationRef): void {
    void (async () => {
      await this.__configSrv.load();
      await this.__i18nSrv.load();

      appRef.bootstrap(AppComponent);
    })();
  }

}
