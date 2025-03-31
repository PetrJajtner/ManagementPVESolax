import { ChangeDetectionStrategy, Component, Signal, effect, inject } from '@angular/core';
import { APPLICATION_BUILD, APPLICATION_DATE, APPLICATION_VERSION } from '@app/app.settings';
import { InverterVersionsType } from '@app/models/versions.model';
import { VersionsService } from '@app/services/versions.service';

/**
 * Komponenta napovedy
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host:            {class: 'help'},
  selector:        'main',
  standalone:      false,
  templateUrl:     './index.component.html'
})
export class IndexComponent {

  /**
   * Sluzba pro nacteni verze stridace
   */
  private __versionsSrv: VersionsService = inject(VersionsService);

  /**
   * Getter verze
   */
  public get applicationVersion(): string {
    return APPLICATION_VERSION;
  }

  /**
   * Getter sestaveni
   */
  public get build(): string {
    return APPLICATION_BUILD;
  }

  /**
   * Getter data sestaveni
   */
  public get date(): string {
    return APPLICATION_DATE;
  }

  /**
   * Getter signalu verzi stridace
   */
  public get inverterVersionsSg(): Signal<InverterVersionsType | undefined> {
    return this.__versionsSrv.versionsSg;
  }

  /**
   * Getter signalu logu
   */
  public get outputSg(): Signal<string | undefined> {
    return this.__versionsSrv.outputSg;
  }

  /**
   * Konstruktor
   */
  public constructor() {
    effect(() => {
      this.outputSg() && setTimeout(() => {
        const element = document.querySelector<HTMLElement>('.plain-text');
        element?.scrollTo({behavior: 'smooth', top: element.scrollHeight});
      }, 250);
    });
  }

  /**
   * Vymaze log spoustece
   */
  public clearOutput(): void {
    void this.__versionsSrv.clearOutput();
  }

  /**
   * Promaze log spoustece
   */
  public eraseOutput(): void {
    void this.__versionsSrv.eraseOutput();
  }

  /**
   * Nacte data logu
   */
  public loadOutput(): void {
    void this.__versionsSrv.loadOutput();
  }

}
