import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpRoutingModule, ROUTER_COMPONENTS } from '@help/help-routing.module';
import { SharedModule } from '@shared/shared.module';

/**
 * Modul pro napovedu
 */
@NgModule({
  declarations: [
    ...ROUTER_COMPONENTS
  ],
  imports: [
    CommonModule,
    HelpRoutingModule,
    SharedModule
  ]
})
export class HelpModule {
}
