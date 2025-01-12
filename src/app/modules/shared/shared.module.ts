import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DateTimePipe } from '@shared/pipes/date-time.pipe';
import { ErrorsPipe } from '@shared/pipes/errors.pipe';
import { KeysPipe } from '@shared/pipes/keys.pipe';
import { LogPipe } from '@shared/pipes/log.pipe';
import { Nl2brPipe } from '@shared/pipes/nl2br.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/**
 * Modul sdilenych soucasti
 */
@NgModule({
  declarations: [
    DateTimePipe,
    ErrorsPipe,
    KeysPipe,
    LogPipe,
    Nl2brPipe,
    TranslatePipe
  ],
  exports: [
    DateTimePipe,
    ErrorsPipe,
    KeysPipe,
    LogPipe,
    Nl2brPipe,
    TranslatePipe
  ],
  imports: [
    CommonModule
  ]
})
export class SharedModule {
}
