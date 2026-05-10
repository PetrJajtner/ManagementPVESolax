import { DOCUMENT, Injectable, Signal, inject, signal } from '@angular/core';

/**
 * Sluzba pro identifikaci zamereni dokumentu [hasFocus()]
 */
@Injectable({
  providedIn: 'root'
})
export class FocusedService {

  /**
   * Instance dokumentu
   */
  private __document: Document = inject<Document>(DOCUMENT);

  /**
   * Signal priznaku zamereni dokumentu
   */
  private __hasFocusSg: Signal<boolean> = (() => {
    const
      hasFocusSg = signal<boolean>(this.__document.hasFocus()),
      eventHandler = () => {
        hasFocusSg.set(this.__document.hasFocus());
      }
    ;

    this.__document.addEventListener('blur', eventHandler);
    this.__document.addEventListener('focus', eventHandler);
    window.addEventListener('blur', eventHandler);
    window.addEventListener('focus', eventHandler);

    return hasFocusSg.asReadonly();
  })();

  /**
   * Getter signalu priznaku zamereni dokumentu
   */
  public get hasFocusSg(): Signal<boolean> {
    return this.__hasFocusSg;
  }

}
