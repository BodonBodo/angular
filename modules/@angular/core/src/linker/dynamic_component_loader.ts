/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable, Injector, ReflectiveInjector, ResolvedReflectiveProvider} from '../di';
import {Type, isPresent} from '../facade/lang';

import {Compiler} from './compiler';
import {ComponentRef} from './component_factory';
import {ViewContainerRef} from './view_container_ref';



/**
 * Use ComponentFactoryResolver and ViewContainerRef directly.
 *
 * @deprecated
 */
export abstract class DynamicComponentLoader {
  /**
   * Creates an instance of a Component `type` and attaches it to the first element in the
   * platform-specific global view that matches the component's selector.
   *
   * In a browser the platform-specific global view is the main DOM Document.
   *
   * If needed, the component's selector can be overridden via `overrideSelector`.
   *
   * A provided {@link Injector} will be used to instantiate the Component.
   *
   * To be notified when this Component instance is destroyed, you can also optionally provide
   * `onDispose` callback.
   *
   * Returns a promise for the {@link ComponentRef} representing the newly created Component.
   *
   * ### Example
   *
   * ```
   * @Component({
   *   selector: 'child-component',
   *   template: 'Child'
   * })
   * class ChildComponent {
   * }
   *
   * @Component({
   *   selector: 'my-app',
   *   template: 'Parent (<child id="child"></child>)'
   * })
   * class MyApp {
   *   constructor(dcl: DynamicComponentLoader, injector: Injector) {
   *     dcl.loadAsRoot(ChildComponent, '#child', injector);
   *   }
   * }
   *
   * bootstrap(MyApp);
   * ```
   *
   * Resulting DOM:
   *
   * ```
   * <my-app>
   *   Parent (
   *     <child id="child">Child</child>
   *   )
   * </my-app>
   * ```
   */
  abstract loadAsRoot(
      type: Type, overrideSelectorOrNode: string|any, injector: Injector, onDispose?: () => void,
      projectableNodes?: any[][]): Promise<ComponentRef<any>>;


  /**
   * Creates an instance of a Component and attaches it to the View Container found at the
   * `location` specified as {@link ViewContainerRef}.
   *
   * You can optionally provide `providers` to configure the {@link Injector} provisioned for this
   * Component Instance.
   *
   * Returns a promise for the {@link ComponentRef} representing the newly created Component.
   *
   *
   * ### Example
   *
   * ```
   * @Component({
   *   selector: 'child-component',
   *   template: 'Child'
   * })
   * class ChildComponent {
   * }
   *
   * @Component({
   *   selector: 'my-app',
   *   template: 'Parent'
   * })
   * class MyApp {
   *   constructor(dcl: DynamicComponentLoader, viewContainerRef: ViewContainerRef) {
   *     dcl.loadNextToLocation(ChildComponent, viewContainerRef);
   *   }
   * }
   *
   * bootstrap(MyApp);
   * ```
   *
   * Resulting DOM:
   *
   * ```
   * <my-app>Parent</my-app>
   * <child-component>Child</child-component>
   * ```
   */
  abstract loadNextToLocation(
      type: Type, location: ViewContainerRef, providers?: ResolvedReflectiveProvider[],
      projectableNodes?: any[][]): Promise<ComponentRef<any>>;
}

@Injectable()
export class DynamicComponentLoader_ extends DynamicComponentLoader {
  constructor(private _compiler: Compiler) { super(); }

  loadAsRoot(
      type: Type, overrideSelectorOrNode: string|any, injector: Injector, onDispose?: () => void,
      projectableNodes?: any[][]): Promise<ComponentRef<any>> {
    return this._compiler.compileComponentAsync(<any>type).then(componentFactory => {
      var componentRef = componentFactory.create(
          injector, projectableNodes,
          isPresent(overrideSelectorOrNode) ? overrideSelectorOrNode : componentFactory.selector);
      if (isPresent(onDispose)) {
        componentRef.onDestroy(onDispose);
      }
      return componentRef;
    });
  }

  loadNextToLocation(
      type: Type, location: ViewContainerRef, providers: ResolvedReflectiveProvider[] = null,
      projectableNodes: any[][] = null): Promise<ComponentRef<any>> {
    return this._compiler.compileComponentAsync(<any>type).then(componentFactory => {
      var contextInjector = location.parentInjector;
      var childInjector = isPresent(providers) && providers.length > 0 ?
          ReflectiveInjector.fromResolvedProviders(providers, contextInjector) :
          contextInjector;
      return location.createComponent(
          componentFactory, location.length, childInjector, projectableNodes);
    });
  }
}
