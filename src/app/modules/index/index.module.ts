import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IndexRoutingModule, ROUTER_COMPONENTS } from '@index/index-routing.module';
import { BatteryPipe } from '@index/pipes/battery.pipe';
import { SharedModule } from '@shared/shared.module';

/**
 * Modul pro uvodni stranku
 */
@NgModule({
  declarations: [
    ...ROUTER_COMPONENTS,
    BatteryPipe
  ],
  imports: [
    CommonModule,
    IndexRoutingModule,
    SharedModule
  ]
})
export class IndexModule {
}
