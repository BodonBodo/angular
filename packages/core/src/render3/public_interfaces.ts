/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Type} from '../core';

import {componentRefresh, diPublic} from './instructions';



/**
 * Definition of what a template rendering function should look like.
 */
export type ComponentTemplate<T> = {
  (ctx: T, creationMode: boolean): void; ngStaticData?: never;
};
export type EmbeddedTemplate<T> = (ctx: T) => void;

export interface ComponentType<T> extends Type<T> { ngComponentDef: ComponentDef<T>; }

export interface DirectiveType<T> extends Type<T> { ngDirectiveDef: DirectiveDef<T>; }

export const enum DirectiveDefFlags {ContentQuery = 0b10}

/**
 * `DirectiveDef` is a compiled version of the Directive used by the renderer instructions.
 */
export interface DirectiveDef<T> {
  /**
   * Token representing the directive. Used by DI.
   */
  type: Type<T>;

  /** Function that makes a directive public to the DI system. */
  diPublic: ((def: DirectiveDef<any>) => void)|null;

  /**
   * List of inputs which are part of the components public API.
   *
   * The key is minified property name whereas the value is the original unminified name.
   */
  inputs: {[P in keyof T]: P};

  /**
   * List of outputs which are part of the components public API.
   *
   * The key is minified property name whereas the value is the original unminified name.=
   */
  outputs: {[P in keyof T]: P};

  /**
   * List of methods which are part of the components public API.
   *
   * The key is minified property name whereas the value is the original unminified name.
   */
  methods: {[P in keyof T]: P};

  /**
   * factory function used to create a new directive instance.
   *
   * NOTE: this property is short (1 char) because it is used in
   * component templates which is sensitive to size.
   */
  n(): T;

  /**
   * Refresh method. Used by the containing component to signal
   * to the directive that it should be refreshed. (Directives
   * usually call life cycle methods at this point.)
   *
   * NOTE: this property is short (1 char) because it is used in
   * component templates which is sensitive to size.
   *
   * @param directiveIndex index of the directive in the containing template
   * @param elementIndex index of an host element for a given directive.
   */
  r(this: DirectiveDef<T>, directiveIndex: number, elementIndex: number): void;
}

export interface ComponentDef<T> extends DirectiveDef<T> {
  /**
   * Refresh method. Used by the containing component to signal
   * to the directive that it should be refreshed. (Directives
   * usually call life cycle methods at this point.)
   *
   * NOTE: this property is short (1 char) because it is used in
   * component templates which is sensitive to size.
   *
   * @param directiveIndex index of the directive in the containing template
   * @param elementIndex index of an host element for a given component.
   */
  r(this: ComponentDef<T>, directiveIndex: number, elementIndex: number): void;

  /**
   * The tag name which should be used by the component.
   *
   * NOTE: only used with component directives.
   */
  tag: string;

  /**
   * The View template of the component.
   *
   * NOTE: only used with component directives.
   */
  template: ComponentTemplate<T>;
}

export interface DirectiveDefArgs<T> {
  type: Type<T>;
  factory: () => T;
  refresh?: (this: DirectiveDef<T>, directiveIndex: number, elementIndex: number) => void;
  inputs?: {[P in keyof T]?: string};
  outputs?: {[P in keyof T]?: string};
  methods?: {[P in keyof T]?: string};
  features?: DirectiveDefFeature[];
}

export interface ComponentDefArgs<T> extends DirectiveDefArgs<T> {
  tag: string;
  template: ComponentTemplate<T>;
  refresh?: (this: ComponentDef<T>, directiveIndex: number, elementIndex: number) => void;
  features?: ComponentDefFeature[];
}

export type DirectiveDefFeature = <T>(directiveDef: DirectiveDef<T>) => void;
export type ComponentDefFeature = <T>(directiveDef: DirectiveDef<T>) => void;

/**
 * Create a component definition object.
 *
 *
 * # Example
 * ```
 * class MyDirective {
 *   // Generated by Angular Template Compiler
 *   // [Symbol] syntax will not be supported by TypeScript until v2.7
 *   static [COMPONENT_DEF_SYMBOL] = defineComponent({
 *     ...
 *   });
 * }
 * ```
 */
export function defineComponent<T>(componentDefinition: ComponentDefArgs<T>): ComponentDef<T> {
  const def = <ComponentDef<any>>{
    type: componentDefinition.type,
    diPublic: null,
    n: componentDefinition.factory,
    tag: (componentDefinition as ComponentDefArgs<T>).tag || null !,
    template: (componentDefinition as ComponentDefArgs<T>).template || null !,
    r: componentDefinition.refresh || componentRefresh,
    inputs: invertObject(componentDefinition.inputs),
    outputs: invertObject(componentDefinition.outputs),
    methods: invertObject(componentDefinition.methods),
  };
  const feature = componentDefinition.features;
  feature && feature.forEach((fn) => fn(def));
  return def;
}

export function NgOnChangesFeature<T>(definition: DirectiveDef<T>) {
  // TODO: implement. See: https://app.asana.com/0/443577627818617/465170715764659
}

export function PublicFeature<T>(definition: DirectiveDef<T>) {
  definition.diPublic = diPublic;
}

const EMPTY = {};

/** Swaps the keys and values of an object. */
function invertObject(obj: any): any {
  if (obj == null) return EMPTY;
  const newObj: any = {};
  for (let minifiedKey in obj) {
    newObj[obj[minifiedKey]] = minifiedKey;
  }
  return newObj;
}

/**
 * Create a directive definition object.
 *
 * # Example
 * ```
 * class MyDirective {
 *   // Generated by Angular Template Compiler
 *   // [Symbol] syntax will not be supported by TypeScript until v2.7
 *   static [DIRECTIVE_DEF_SYMBOL] = defineDirective({
 *     ...
 *   });
 * }
 * ```
 */
export const defineDirective = defineComponent as<T>(directiveDefinition: DirectiveDefArgs<T>) =>
    DirectiveDef<T>;
