import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DateFmtPipe } from '@shared/pipes/date-fmt.pipe';
import { ErrorsPipe } from '@shared/pipes/errors.pipe';
import { KeysPipe } from '@shared/pipes/keys.pipe';
import { LogPipe } from '@shared/pipes/log.pipe';
import { Nl2brPipe } from '@shared/pipes/nl2br.pipe';
import { NumberFmtPipe } from '@shared/pipes/number-fmt.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

/**
 * Modul sdilenych soucasti
 */
@NgModule({
  declarations: [
    DateFmtPipe,
    ErrorsPipe,
    KeysPipe,
    LogPipe,
    Nl2brPipe,
    NumberFmtPipe,
    TranslatePipe
  ],
  exports: [
    DateFmtPipe,
    ErrorsPipe,
    KeysPipe,
    LogPipe,
    Nl2brPipe,
    NumberFmtPipe,
    TranslatePipe
  ],
  imports: [
    CommonModule
  ]
})
export class SharedModule {
}
