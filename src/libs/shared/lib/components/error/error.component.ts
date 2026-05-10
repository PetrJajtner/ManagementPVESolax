import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Komponenta pro zobrazeni nenalezene stranky
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports:         [TranslatePipe],
  selector:        'main',
  templateUrl:     './error.component.html'
})
export class ErrorComponent {

  /**
   * Sluzba smerovace
   */
  private __router: Router = inject(Router);

  /**
   * Nenalezena URL adresa
   */
  public get url(): string {
    return this.__router.url;
  }

}
