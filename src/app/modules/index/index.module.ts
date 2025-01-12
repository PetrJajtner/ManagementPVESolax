import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IndexRoutingModule, ROUTER_COMPONENTS } from '@index/index-routing.module';
import { BatteryStrokePipe } from '@index/pipes/battery-stroke.pipe';
import { SharedModule } from '@shared/shared.module';

/**
 * Modul pro uvodni stranku
 */
@NgModule({
  declarations: [
    ...ROUTER_COMPONENTS,
    BatteryStrokePipe
  ],
  imports: [
    CommonModule,
    IndexRoutingModule,
    SharedModule
  ]
})
export class IndexModule {
}
