import { NgClass, NgStyle } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, Component, Signal, effect, inject
} from '@angular/core';
import { MANUAL_MODES, PriceType } from '@libs/pve';
import { DateFmtPipe, FocusedService, NumberFmtPipe, TranslatePipe } from '@libs/shared';
import { BatteryPipe } from '../pipes/battery.pipe';
import { ComponentData, IndexService } from '../services/index.service';

/**
 * Komponenta uvodni stranky
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  host:            {class: 'index'},
  imports:         [
    BatteryPipe,
    DateFmtPipe,
    NgClass,
    NgStyle,
    NumberFmtPipe,
    TranslatePipe
  ],
  selector:        'main',
  templateUrl:     './index.component.html'
})
export class IndexComponent implements AfterViewInit {

  /**
   * Sluzba pro identifikaci zamereni dokumentu
   */
  private __focusedSrv: FocusedService = inject<FocusedService>(FocusedService);

  /**
   * Sluzba pro prehledovou stranku
   */
  private __indexSrv: IndexService = inject<IndexService>(IndexService);

  /**
   * Getter signalu dat komponenty
   */
  public get dataSg(): Signal<ComponentData> {
    return this.__indexSrv.dataSg;
  }

  /**
   * Getter rezimu nuceneho nabijeni/vybijeni v manualnim rezimu
   */
  public get manualModes(): readonly string[] {
    return MANUAL_MODES;
  }

  /**
   * Konstruktor
   */
  public constructor() {
    /**
     * Reakce na obdrzeni zamereni dokumentu
     */
    effect(() => {
      if (this.__focusedSrv.hasFocusSg()) {
        this.__indexSrv.scrollToCurrentQuarter();
      }
    });
  }

  /**
   * Zobrazi ceny OTE na dalsi den
   */
  public displayPrediction(): void {
    this.__indexSrv.displayPrediction();
  }

  /**
   * Zobrazi ceny OTE aktualniho dne
   */
  public displayPrices(): void {
    this.__indexSrv.displayPrices();
  }

  /**
   * Rutiny po inicializaci sablon
   */
  public ngAfterViewInit(): void {
    this.__indexSrv.scrollToCurrentQuarter();
  }

  /**
   * Obnovi ziva data
   */
  public refresh(): void {
    this.__indexSrv.refresh();
  }

  /**
   * Prepne zobrazeni cen
   */
  public switchPrice(): void {
    this.__indexSrv.switchPrice();
  }

  /**
   * Prepne nabijeci polozku
   */
  public toogleCharge(date: string, item: PriceType): void {
    this.__indexSrv.toogleCharge(date, item);
  }

}
