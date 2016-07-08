/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {PlatformLocation} from '@angular/common';
import {CompilerFactory, ComponentRef, OpaqueToken, PLATFORM_COMMON_PROVIDERS, PLATFORM_INITIALIZER, PlatformRef, ReflectiveInjector, Type, assertPlatform, coreLoadAndBootstrap, createPlatform, createPlatformFactory, getPlatform} from '@angular/core';
import {BROWSER_DYNAMIC_TEST_COMPILER_FACTORY} from '@angular/platform-browser-dynamic/testing';

import {ReflectionCapabilities, reflector, wtfInit} from '../core_private';

import {Parse5DomAdapter} from './parse5_adapter';

function notSupported(feature: string): Error {
  throw new Error(`platform-server does not support '${feature}'.`);
}

class ServerPlatformLocation extends PlatformLocation {
  getBaseHrefFromDOM(): string { throw notSupported('getBaseHrefFromDOM'); };
  onPopState(fn: any): void { notSupported('onPopState'); };
  onHashChange(fn: any): void { notSupported('onHashChange'); };
  get pathname(): string { throw notSupported('pathname'); }
  get search(): string { throw notSupported('search'); }
  get hash(): string { throw notSupported('hash'); }
  replaceState(state: any, title: string, url: string): void { notSupported('replaceState'); };
  pushState(state: any, title: string, url: string): void { notSupported('pushState'); };
  forward(): void { notSupported('forward'); };
  back(): void { notSupported('back'); };
}

/**
 * A set of providers to initialize the Angular platform in a server.
 *
 * Used automatically by `serverBootstrap`, or can be passed to `platform`.
 * @experimental
 */
export const SERVER_PLATFORM_PROVIDERS: Array<any /*Type | Provider | any[]*/> = [
  PLATFORM_COMMON_PROVIDERS,
  {provide: PLATFORM_INITIALIZER, useValue: initParse5Adapter, multi: true},
  {provide: PlatformLocation, useClass: ServerPlatformLocation},
];

const SERVER_DYNAMIC_PROVIDERS: any[] = [
  SERVER_PLATFORM_PROVIDERS,
  {provide: CompilerFactory, useValue: BROWSER_DYNAMIC_TEST_COMPILER_FACTORY},
];


function initParse5Adapter() {
  Parse5DomAdapter.makeCurrent();
  wtfInit();
}

/**
 * @experimental
 */
export const serverPlatform = createPlatformFactory('server', SERVER_PLATFORM_PROVIDERS);

/**
 * The server platform that supports the runtime compiler.
 *
 * @experimental
 */
export const serverDynamicPlatform =
    createPlatformFactory('serverDynamic', SERVER_DYNAMIC_PROVIDERS);

/**
 * Used to bootstrap Angular in server environment (such as node).
 *
 * This version of bootstrap only creates platform injector and does not define anything for
 * application injector. It is expected that application providers are imported from other
 * packages such as `@angular/platform-browser` or `@angular/platform-browser-dynamic`.
 *
 * ```
 * import {BROWSER_APP_PROVIDERS} from '@angular/platform-browser';
 * import {BROWSER_APP_COMPILER_PROVIDERS} from '@angular/platform-browser-dynamic';
 *
 * serverBootstrap(..., [BROWSER_APP_PROVIDERS, BROWSER_APP_COMPILER_PROVIDERS])
 * ```
 *
 * @experimental
 */
export function serverBootstrap(
    appComponentType: Type,
    providers: Array<any /*Type | Provider | any[]*/>): Promise<ComponentRef<any>> {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  var appInjector = ReflectiveInjector.resolveAndCreate(providers, serverPlatform().injector);
  return coreLoadAndBootstrap(appComponentType, appInjector);
}
