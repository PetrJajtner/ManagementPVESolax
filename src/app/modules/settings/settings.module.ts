import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ROUTER_COMPONENTS, SettingsRoutingModule } from '@settings/settings-routing.module';
import { SharedModule } from '@shared/shared.module';

/**
 * Modul pro nastaveni aplikace
 */
@NgModule({
  declarations: [
    ...ROUTER_COMPONENTS
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsRoutingModule,
    SharedModule
  ]
})
export class SettingsModule {
}
