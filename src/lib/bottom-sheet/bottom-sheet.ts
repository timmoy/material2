/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal, TemplatePortal, ComponentType, PortalInjector} from '@angular/cdk/portal';
import {ComponentRef, TemplateRef, Injectable, Injector, Optional, SkipSelf} from '@angular/core';
import {MatBottomSheetConfig, MAT_BOTTOM_SHEET_DATA} from './bottom-sheet-config';
import {MatBottomSheetRef} from './bottom-sheet-ref';
import {MatBottomSheetContainer} from './bottom-sheet-container';

/**
 * Service to trigger Material Design bottom sheets.
 */
@Injectable()
export class MatBottomSheet {
  private _bottomSheetRefAtThisLevel: MatBottomSheetRef<any> | null = null;

  /** Reference to the currently opened bottom sheet. */
  get _openedBottomSheetRef(): MatBottomSheetRef<any> | null {
    const parent = this._parentBottomSheet;
    return parent ? parent._openedBottomSheetRef : this._bottomSheetRefAtThisLevel;
  }

  set _openedBottomSheetRef(value: MatBottomSheetRef<any> | null) {
    if (this._parentBottomSheet) {
      this._parentBottomSheet._openedBottomSheetRef = value;
    } else {
      this._bottomSheetRefAtThisLevel = value;
    }
  }

  constructor(
      private _overlay: Overlay,
      private _injector: Injector,
      @Optional() @SkipSelf() private _parentBottomSheet: MatBottomSheet) {}

  open<T, D = any, R = any>(component: ComponentType<T>,
                   config?: MatBottomSheetConfig<D>): MatBottomSheetRef<T, R>;
  open<T, D = any, R = any>(template: TemplateRef<T>,
                   config?: MatBottomSheetConfig<D>): MatBottomSheetRef<T, R>;

  open<T, D = any, R = any>(componentOrTemplateRef: ComponentType<T> | TemplateRef<T>,
                   config?: MatBottomSheetConfig<D>): MatBottomSheetRef<T, R> {

    const _config = _applyConfigDefaults(config);
    const overlayRef = this._createOverlay(_config);
    const container = this._attachContainer(overlayRef, _config);
    const ref = new MatBottomSheetRef<T, R>(container, overlayRef);

    if (componentOrTemplateRef instanceof TemplateRef) {
      container.attachTemplatePortal(new TemplatePortal<T>(componentOrTemplateRef, null!, {
        $implicit: _config.data,
        bottomSheetRef: ref
      } as any));
    } else {
      const portal = new ComponentPortal(componentOrTemplateRef, undefined,
            this._createInjector(_config, ref));
      const contentRef = container.attachComponentPortal(portal);
      ref.instance = contentRef.instance;
    }

    // When the bottom sheet is dismissed, clear the reference to it.
    ref.afterDismissed().subscribe(() => {
      // Clear the bottom sheet ref if it hasn't already been replaced by a newer one.
      if (this._openedBottomSheetRef == ref) {
        this._openedBottomSheetRef = null;
      }
    });

    if (this._openedBottomSheetRef) {
      // If a bottom sheet is already in view, dismiss it and enter the
      // new bottom sheet after exit animation is complete.
      this._openedBottomSheetRef.afterDismissed().subscribe(() => ref.containerInstance.enter());
      this._openedBottomSheetRef.dismiss();
    } else {
      // If no bottom sheet is in view, enter the new bottom sheet.
      ref.containerInstance.enter();
    }

    this._openedBottomSheetRef = ref;

    return ref;
  }

  /**
   * Dismisses the currently-visible bottom sheet.
   */
  dismiss(): void {
    if (this._openedBottomSheetRef) {
      this._openedBottomSheetRef.dismiss();
    }
  }

  /**
   * Attaches the bottom sheet container component to the overlay.
   */
  private _attachContainer(overlayRef: OverlayRef,
                           config: MatBottomSheetConfig): MatBottomSheetContainer {
    const containerPortal = new ComponentPortal(MatBottomSheetContainer, config.viewContainerRef);
    const containerRef: ComponentRef<MatBottomSheetContainer> = overlayRef.attach(containerPortal);
    containerRef.instance.bottomSheetConfig = config;
    return containerRef.instance;
  }

  /**
   * Creates a new overlay and places it in the correct location.
   * @param config The user-specified bottom sheet config.
   */
  private _createOverlay(config: MatBottomSheetConfig): OverlayRef {
    const overlayConfig = new OverlayConfig({
      direction: config.direction,
      hasBackdrop: config.hasBackdrop,
      maxWidth: '100%',
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy: this._overlay.position()
        .global()
        .centerHorizontally()
        .bottom('0')
    });

    if (config.backdropClass) {
      overlayConfig.backdropClass = config.backdropClass;
    }

    return this._overlay.create(overlayConfig);
  }

  /**
   * Creates an injector to be used inside of a bottom sheet component.
   * @param config Config that was used to create the bottom sheet.
   * @param bottomSheetRef Reference to the bottom sheet.
   */
  private _createInjector<T>(config: MatBottomSheetConfig,
                             bottomSheetRef: MatBottomSheetRef<T>): PortalInjector {

    const userInjector = config && config.viewContainerRef && config.viewContainerRef.injector;
    const injectionTokens = new WeakMap();

    injectionTokens.set(MatBottomSheetRef, bottomSheetRef);
    injectionTokens.set(MAT_BOTTOM_SHEET_DATA, config.data);

    return new PortalInjector(userInjector || this._injector, injectionTokens);
  }
}

/**
 * Applies default options to the bottom sheet config.
 * @param config The configuration to which the defaults will be applied.
 * @returns The new configuration object with defaults applied.
 */
function _applyConfigDefaults(config?: MatBottomSheetConfig): MatBottomSheetConfig {
  return {...new MatBottomSheetConfig(), ...config};
}
