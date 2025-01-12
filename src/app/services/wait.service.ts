import { Injectable, Signal } from '@angular/core';
import { Loading } from '@app/models/loading.model';

/**
 * Sluzba pro vyckavani
 */
@Injectable({
  providedIn: 'root'
})
export class WaitService extends Loading {

  /**
   * Getter pro priznak vyckavani
   */
  public get wait(): boolean {
    return this._isLoading;
  }

  /**
   * Setter priznaku vyckavani
   */
  public set wait(state: boolean) {
    this._isLoading = state;
  }

  /**
   * Getter streamu priznaku vyckavani
   */
  public get waitSg(): Signal<boolean> {
    return this._isLoadingSg;
  }

}
