/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Compiler, CompilerOptions, Component, ComponentFactory, Directive, Injector, NgModule, Pipe, Type} from '@angular/core';

import {MetadataOverride} from './metadata_override';

function unimplemented(): any {
  throw Error('unimplemented');
}

/**
 * Special interface to the compiler only used by testing
 *
 * @experimental
 */
export class TestingCompiler extends Compiler {
  get injector(): Injector { throw unimplemented(); }
  overrideModule(module: Type<any>, overrides: MetadataOverride<NgModule>): void {
    throw unimplemented();
  }
  overrideDirective(directive: Type<any>, overrides: MetadataOverride<Directive>): void {
    throw unimplemented();
  }
  overrideComponent(component: Type<any>, overrides: MetadataOverride<Component>): void {
    throw unimplemented();
  }
  overridePipe(directive: Type<any>, overrides: MetadataOverride<Pipe>): void {
    throw unimplemented();
  }
  /**
   * Allows to pass the compile summary from AOT compilation to the JIT compiler,
   * so that it can use the code generated by AOT.
   */
  loadAotSummaries(summaries: () => any[]) { throw unimplemented(); };

  /**
   * Gets the component factory for the given component.
   * This assumes that the component has been compiled before calling this call using
   * `compileModuleAndAllComponents*`.
   */
  getComponentFactory<T>(component: Type<T>): ComponentFactory<T> { throw unimplemented(); }

  /**
   * Returns the component type that is stored in the given error.
   * This can be used for errors created by compileModule...
   */
  getComponentFromError(error: Error): Type<any>|null { throw unimplemented(); }
}

/**
 * A factory for creating a Compiler
 *
 * @experimental
 */
export abstract class TestingCompilerFactory {
  abstract createTestingCompiler(options?: CompilerOptions[]): TestingCompiler;
}
