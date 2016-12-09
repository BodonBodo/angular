/**
 * This file is generated by the Angular 2 template compiler.
 * Do not edit.
 */
/* tslint:disable */

import * as import2 from '@angular/common/src/common_module';
import * as import5 from '@angular/common/src/localization';
import * as import34 from '@angular/core/src/animation/animation_queue';
import * as import6 from '@angular/core/src/application_init';
import * as import3 from '@angular/core/src/application_module';
import * as import8 from '@angular/core/src/application_ref';
import * as import19 from '@angular/core/src/application_tokens';
import * as import31 from '@angular/core/src/change_detection/differs/iterable_differs';
import * as import32 from '@angular/core/src/change_detection/differs/keyvalue_differs';
import * as import24 from '@angular/core/src/console';
import * as import17 from '@angular/core/src/di/injector';
import * as import26 from '@angular/core/src/error_handler';
import * as import33 from '@angular/core/src/i18n/tokens';
import * as import25 from '@angular/core/src/i18n/tokens';
import * as import9 from '@angular/core/src/linker/compiler';
import * as import0 from '@angular/core/src/linker/ng_module_factory';
import * as import15 from '@angular/core/src/linker/view_utils';
import * as import29 from '@angular/core/src/render/api';
import * as import30 from '@angular/core/src/security';
import * as import7 from '@angular/core/src/testability/testability';
import * as import22 from '@angular/core/src/zone/ng_zone';
import * as import4 from '@angular/platform-browser/src/browser';
import * as import16 from '@angular/platform-browser/src/browser/title';
import * as import28 from '@angular/platform-browser/src/dom/animation_driver';
import * as import23 from '@angular/platform-browser/src/dom/debug/ng_probe';
import * as import13 from '@angular/platform-browser/src/dom/dom_renderer';
import * as import27 from '@angular/platform-browser/src/dom/dom_tokens';
import * as import20 from '@angular/platform-browser/src/dom/events/dom_events';
import * as import11 from '@angular/platform-browser/src/dom/events/event_manager';
import * as import10 from '@angular/platform-browser/src/dom/events/hammer_gestures';
import * as import21 from '@angular/platform-browser/src/dom/events/key_events';
import * as import12 from '@angular/platform-browser/src/dom/shared_styles_host';
import * as import14 from '@angular/platform-browser/src/security/dom_sanitization_service';

import * as import1 from './tree';
import * as import18 from './tree_host.ngfactory';

class AppModuleInjector extends import0.NgModuleInjector<import1.AppModule> {
  _CommonModule_0: import2.CommonModule;
  _ApplicationModule_1: import3.ApplicationModule;
  _BrowserModule_2: import4.BrowserModule;
  _AppModule_3: import1.AppModule;
  __LOCALE_ID_4: any;
  __NgLocalization_5: import5.NgLocaleLocalization;
  _ErrorHandler_6: any;
  _ApplicationInitStatus_7: import6.ApplicationInitStatus;
  _Testability_8: import7.Testability;
  _ApplicationRef__9: import8.ApplicationRef_;
  __ApplicationRef_10: any;
  __Compiler_11: import9.Compiler;
  __APP_ID_12: any;
  __DOCUMENT_13: any;
  __HAMMER_GESTURE_CONFIG_14: import10.HammerGestureConfig;
  __EVENT_MANAGER_PLUGINS_15: any[];
  __EventManager_16: import11.EventManager;
  __DomSharedStylesHost_17: import12.DomSharedStylesHost;
  __AnimationDriver_18: any;
  __DomRootRenderer_19: import13.DomRootRenderer_;
  __RootRenderer_20: any;
  __DomSanitizer_21: import14.DomSanitizerImpl;
  __Sanitizer_22: any;
  __ViewUtils_23: import15.ViewUtils;
  __IterableDiffers_24: any;
  __KeyValueDiffers_25: any;
  __SharedStylesHost_26: any;
  __Title_27: import16.Title;
  __TRANSLATIONS_FORMAT_28: any;
  __AnimationQueue_29: import34.AnimationQueue;
  constructor(parent: import17.Injector) {
    super(parent, [import18.TreeComponentNgFactory], [import18.TreeComponentNgFactory]);
  }
  get _LOCALE_ID_4(): any {
    if ((this.__LOCALE_ID_4 == (null as any))) {
      (this.__LOCALE_ID_4 = (null as any));
    }
    return this.__LOCALE_ID_4;
  }
  get _NgLocalization_5(): import5.NgLocaleLocalization {
    if ((this.__NgLocalization_5 == (null as any))) {
      (this.__NgLocalization_5 = new import5.NgLocaleLocalization(this._LOCALE_ID_4));
    }
    return this.__NgLocalization_5;
  }
  get _ApplicationRef_10(): any {
    if ((this.__ApplicationRef_10 == (null as any))) {
      (this.__ApplicationRef_10 = this._ApplicationRef__9);
    }
    return this.__ApplicationRef_10;
  }
  get _Compiler_11(): import9.Compiler {
    if ((this.__Compiler_11 == (null as any))) {
      (this.__Compiler_11 = new import9.Compiler());
    }
    return this.__Compiler_11;
  }
  get _APP_ID_12(): any {
    if ((this.__APP_ID_12 == (null as any))) {
      (this.__APP_ID_12 = import19._appIdRandomProviderFactory());
    }
    return this.__APP_ID_12;
  }
  get _DOCUMENT_13(): any {
    if ((this.__DOCUMENT_13 == (null as any))) {
      (this.__DOCUMENT_13 = import4._document());
    }
    return this.__DOCUMENT_13;
  }
  get _HAMMER_GESTURE_CONFIG_14(): import10.HammerGestureConfig {
    if ((this.__HAMMER_GESTURE_CONFIG_14 == (null as any))) {
      (this.__HAMMER_GESTURE_CONFIG_14 = new import10.HammerGestureConfig());
    }
    return this.__HAMMER_GESTURE_CONFIG_14;
  }
  get _EVENT_MANAGER_PLUGINS_15(): any[] {
    if ((this.__EVENT_MANAGER_PLUGINS_15 == (null as any))) {
      (this.__EVENT_MANAGER_PLUGINS_15 = [
        new import20.DomEventsPlugin(), new import21.KeyEventsPlugin(),
        new import10.HammerGesturesPlugin(this._HAMMER_GESTURE_CONFIG_14)
      ]);
    }
    return this.__EVENT_MANAGER_PLUGINS_15;
  }
  get _EventManager_16(): import11.EventManager {
    if ((this.__EventManager_16 == (null as any))) {
      (this.__EventManager_16 = new import11.EventManager(
           this._EVENT_MANAGER_PLUGINS_15, this.parent.get(import22.NgZone)));
    }
    return this.__EventManager_16;
  }
  get _DomSharedStylesHost_17(): import12.DomSharedStylesHost {
    if ((this.__DomSharedStylesHost_17 == (null as any))) {
      (this.__DomSharedStylesHost_17 = new import12.DomSharedStylesHost(this._DOCUMENT_13));
    }
    return this.__DomSharedStylesHost_17;
  }
  get _AnimationDriver_18(): any {
    if ((this.__AnimationDriver_18 == (null as any))) {
      (this.__AnimationDriver_18 = import4._resolveDefaultAnimationDriver());
    }
    return this.__AnimationDriver_18;
  }
  get _DomRootRenderer_19(): import13.DomRootRenderer_ {
    if ((this.__DomRootRenderer_19 == (null as any))) {
      (this.__DomRootRenderer_19 = new import13.DomRootRenderer_(
           this._DOCUMENT_13, this._EventManager_16, this._DomSharedStylesHost_17,
           this._AnimationDriver_18, this._APP_ID_12));
    }
    return this.__DomRootRenderer_19;
  }
  get _RootRenderer_20(): any {
    if ((this.__RootRenderer_20 == (null as any))) {
      (this.__RootRenderer_20 = import23._createConditionalRootRenderer(
           this._DomRootRenderer_19, this.parent.get(import23.NgProbeToken, (null as any)),
           this.parent.get(import8.NgProbeToken, (null as any))));
    }
    return this.__RootRenderer_20;
  }
  get _DomSanitizer_21(): import14.DomSanitizerImpl {
    if ((this.__DomSanitizer_21 == (null as any))) {
      (this.__DomSanitizer_21 = new import14.DomSanitizerImpl());
    }
    return this.__DomSanitizer_21;
  }
  get _Sanitizer_22(): any {
    if ((this.__Sanitizer_22 == (null as any))) {
      (this.__Sanitizer_22 = this._DomSanitizer_21);
    }
    return this.__Sanitizer_22;
  }
  get _ViewUtils_23(): import15.ViewUtils {
    if ((this.__ViewUtils_23 == (null as any))) {
      (this.__ViewUtils_23 = new import15.ViewUtils(
           this._RootRenderer_20, this._Sanitizer_22, this._AnimationQueue_29));
    }
    return this.__ViewUtils_23;
  }
  get _AnimationQueue_29(): import34.AnimationQueue {
    if ((this.__AnimationQueue_29 == (null as any))) {
      (this.__AnimationQueue_29 = new import34.AnimationQueue(this.parent.get(import22.NgZone)));
    }
    return this.__AnimationQueue_29;
  }
  get _IterableDiffers_24(): any {
    if ((this.__IterableDiffers_24 == (null as any))) {
      (this.__IterableDiffers_24 = import3._iterableDiffersFactory());
    }
    return this.__IterableDiffers_24;
  }
  get _KeyValueDiffers_25(): any {
    if ((this.__KeyValueDiffers_25 == (null as any))) {
      (this.__KeyValueDiffers_25 = import3._keyValueDiffersFactory());
    }
    return this.__KeyValueDiffers_25;
  }
  get _SharedStylesHost_26(): any {
    if ((this.__SharedStylesHost_26 == (null as any))) {
      (this.__SharedStylesHost_26 = this._DomSharedStylesHost_17);
    }
    return this.__SharedStylesHost_26;
  }
  get _Title_27(): import16.Title {
    if ((this.__Title_27 == (null as any))) {
      (this.__Title_27 = new import16.Title());
    }
    return this.__Title_27;
  }
  get _TRANSLATIONS_FORMAT_28(): any {
    if ((this.__TRANSLATIONS_FORMAT_28 == (null as any))) {
      (this.__TRANSLATIONS_FORMAT_28 = (null as any));
    }
    return this.__TRANSLATIONS_FORMAT_28;
  }
  createInternal(): import1.AppModule {
    this._CommonModule_0 = new import2.CommonModule();
    this._ApplicationModule_1 = new import3.ApplicationModule();
    this._BrowserModule_2 =
        new import4.BrowserModule(this.parent.get(import4.BrowserModule, (null as any)));
    this._AppModule_3 = new import1.AppModule();
    this._ErrorHandler_6 = import4.errorHandler();
    this._ApplicationInitStatus_7 =
        new import6.ApplicationInitStatus(this.parent.get(import6.APP_INITIALIZER, (null as any)));
    this._Testability_8 = new import7.Testability(this.parent.get(import22.NgZone));
    this._ApplicationRef__9 = new import8.ApplicationRef_(
        this.parent.get(import22.NgZone), this.parent.get(import24.Console), this,
        this._ErrorHandler_6, this, this._ApplicationInitStatus_7,
        this.parent.get(import7.TestabilityRegistry, (null as any)), this._Testability_8);
    return this._AppModule_3;
  }
  getInternal(token: any, notFoundResult: any): any {
    if ((token === import2.CommonModule)) {
      return this._CommonModule_0;
    }
    if ((token === import3.ApplicationModule)) {
      return this._ApplicationModule_1;
    }
    if ((token === import4.BrowserModule)) {
      return this._BrowserModule_2;
    }
    if ((token === import1.AppModule)) {
      return this._AppModule_3;
    }
    if ((token === import25.LOCALE_ID)) {
      return this._LOCALE_ID_4;
    }
    if ((token === import5.NgLocalization)) {
      return this._NgLocalization_5;
    }
    if ((token === import26.ErrorHandler)) {
      return this._ErrorHandler_6;
    }
    if ((token === import6.ApplicationInitStatus)) {
      return this._ApplicationInitStatus_7;
    }
    if ((token === import7.Testability)) {
      return this._Testability_8;
    }
    if ((token === import8.ApplicationRef_)) {
      return this._ApplicationRef__9;
    }
    if ((token === import8.ApplicationRef)) {
      return this._ApplicationRef_10;
    }
    if ((token === import9.Compiler)) {
      return this._Compiler_11;
    }
    if ((token === import19.APP_ID)) {
      return this._APP_ID_12;
    }
    if ((token === import27.DOCUMENT)) {
      return this._DOCUMENT_13;
    }
    if ((token === import10.HAMMER_GESTURE_CONFIG)) {
      return this._HAMMER_GESTURE_CONFIG_14;
    }
    if ((token === import11.EVENT_MANAGER_PLUGINS)) {
      return this._EVENT_MANAGER_PLUGINS_15;
    }
    if ((token === import11.EventManager)) {
      return this._EventManager_16;
    }
    if ((token === import12.DomSharedStylesHost)) {
      return this._DomSharedStylesHost_17;
    }
    if ((token === import28.AnimationDriver)) {
      return this._AnimationDriver_18;
    }
    if ((token === import13.DomRootRenderer)) {
      return this._DomRootRenderer_19;
    }
    if ((token === import29.RootRenderer)) {
      return this._RootRenderer_20;
    }
    if ((token === import14.DomSanitizer)) {
      return this._DomSanitizer_21;
    }
    if ((token === import30.Sanitizer)) {
      return this._Sanitizer_22;
    }
    if ((token === import15.ViewUtils)) {
      return this._ViewUtils_23;
    }
    if ((token === import31.IterableDiffers)) {
      return this._IterableDiffers_24;
    }
    if ((token === import32.KeyValueDiffers)) {
      return this._KeyValueDiffers_25;
    }
    if ((token === import12.SharedStylesHost)) {
      return this._SharedStylesHost_26;
    }
    if ((token === import16.Title)) {
      return this._Title_27;
    }
    if ((token === import33.TRANSLATIONS_FORMAT)) {
      return this._TRANSLATIONS_FORMAT_28;
    }
    return notFoundResult;
  }
  destroyInternal(): void { this._ApplicationRef__9.ngOnDestroy(); }
}
export const AppModuleNgFactory: import0.NgModuleFactory<import1.AppModule> =
    new import0.NgModuleFactory(AppModuleInjector, import1.AppModule);
