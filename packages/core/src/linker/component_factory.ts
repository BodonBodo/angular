/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ChangeDetectorRef} from '../change_detection/change_detection';
import {Injector} from '../di/injector';
import {Type} from '../type';

import {ElementRef} from './element_ref';
import {NgModuleRef} from './ng_module_factory';
import {ViewRef} from './view_ref';

/**
 * Represents an instance of a Component created via a {@link ComponentFactory}.
 *
 * `ComponentRef` provides access to the Component Instance as well other objects related to this
 * Component Instance and allows you to destroy the Component Instance via the {@link #destroy}
 * method.
 * @stable
 */
export abstract class ComponentRef<C> {
  /**
   * Location of the Host Element of this Component Instance.
   */
  readonly location: ElementRef;

  /**
   * The injector on which the component instance exists.
   */
  readonly injector: Injector;

  /**
   * The instance of the Component.
   */
  readonly instance: C;

  /**
   * The {@link ViewRef} of the Host View of this Component instance.
   */
  readonly hostView: ViewRef;

  /**
   * The {@link ChangeDetectorRef} of the Component instance.
   */
  readonly changeDetectorRef: ChangeDetectorRef;

  /**
   * The component type.
   */
  readonly componentType: Type<any>;

  /**
   * Destroys the component instance and all of the data structures associated with it.
   */
  abstract destroy(): void;

  /**
   * Allows to register a callback that will be called when the component is destroyed.
   */
  abstract onDestroy(callback: Function): void;
}

/**
 * @stable
 */
export abstract class ComponentFactory<C> {
  readonly selector: string;
  readonly componentType: Type<any>;
  /**
   * selector for all <ng-content> elements in the component.
   */
  readonly ngContentSelectors: string[];
  /**
   * the inputs of the component.
   */
  readonly inputs: {propName: string, templateName: string}[];
  /**
   * the outputs of the component.
   */
  readonly outputs: {propName: string, templateName: string}[];
  /**
   * Creates a new component.
   */
  abstract create(
      injector: Injector, projectableNodes?: any[][], rootSelectorOrNode?: string|any,
      ngModule?: NgModuleRef<any>): ComponentRef<C>;
}
