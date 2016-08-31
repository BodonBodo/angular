/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ResourceLoader, platformCoreDynamic} from '@angular/compiler';
import {ApplicationRef, COMPILER_OPTIONS, CUSTOM_ELEMENTS_SCHEMA, ClassProvider, CompilerFactory, CompilerOptions, ComponentRef, ExistingProvider, FactoryProvider, NgModule, PlatformRef, Provider, Type, TypeProvider, ValueProvider, createPlatformFactory} from '@angular/core';
import {BrowserModule, WORKER_SCRIPT, WorkerAppModule, platformWorkerUi} from '@angular/platform-browser';

import {INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS} from './platform_providers';
import {Console} from './private_import_core';
import {CachedResourceLoader} from './resource_loader/resource_loader_cache';
import {ResourceLoaderImpl} from './resource_loader/resource_loader_impl';

export * from './private_export';

/**
 * @experimental
 */
export const RESOURCE_CACHE_PROVIDER: Provider[] =
    [{provide: ResourceLoader, useClass: CachedResourceLoader}];

/**
 * @experimental API related to bootstrapping are still under review.
 */
export const platformBrowserDynamic = createPlatformFactory(
    platformCoreDynamic, 'browserDynamic', INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS);

/**
 * Bootstraps the worker ui.
 *
 * @experimental
 */
export function bootstrapWorkerUi(
    workerScriptUri: string, customProviders: Provider[] = []): Promise<PlatformRef> {
  // For now, just creates the worker ui platform...
  return Promise.resolve(platformWorkerUi(([{
                                            provide: WORKER_SCRIPT,
                                            useValue: workerScriptUri,
                                          }] as Provider[])
                                              .concat(customProviders)));
}

/**
 * @experimental API related to bootstrapping are still under review.
 */
export const platformWorkerAppDynamic = createPlatformFactory(
    platformCoreDynamic, 'workerAppDynamic', [{
      provide: COMPILER_OPTIONS,
      useValue: {providers: [{provide: ResourceLoader, useClass: ResourceLoaderImpl}]},
      multi: true
    }]);

function normalizeArray(arr: any[]): any[] {
  return arr ? arr : [];
}
