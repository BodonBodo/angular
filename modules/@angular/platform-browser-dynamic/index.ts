/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {XHR, analyzeAppProvidersForDeprecatedConfiguration, platformCoreDynamic} from '@angular/compiler';
import {ApplicationRef, COMPILER_OPTIONS, CUSTOM_ELEMENTS_SCHEMA, CompilerFactory, CompilerOptions, ComponentRef, NgModule, PlatformRef, Provider, Type, createPlatformFactory} from '@angular/core';
import {BrowserModule, WORKER_SCRIPT, WorkerAppModule, platformWorkerUi} from '@angular/platform-browser';

import {Console} from './core_private';
import {INTERNAL_BROWSER_DYNAMIC_PLATFORM_PROVIDERS} from './src/platform_providers';
import {CachedXHR} from './src/xhr/xhr_cache';
import {XHRImpl} from './src/xhr/xhr_impl';



/**
 * @experimental
 */
export const CACHED_TEMPLATE_PROVIDER: Provider[] = [{provide: XHR, useClass: CachedXHR}];

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
export const platformWorkerAppDynamic =
    createPlatformFactory(platformCoreDynamic, 'workerAppDynamic', [{
                            provide: COMPILER_OPTIONS,
                            useValue: {providers: [{provide: XHR, useClass: XHRImpl}]},
                            multi: true
                          }]);

function normalizeArray(arr: any[]): any[] {
  return arr ? arr : [];
}
