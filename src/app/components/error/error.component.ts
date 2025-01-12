import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Komponenta pro zobrazeni nenalezene stranky
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector:        'main',
  standalone:      false,
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
