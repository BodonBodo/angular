/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Route} from './config';
import {RouterStateSnapshot} from './router_state';

/**
 * @whatItDoes Represents an event triggered when a navigation starts.
 *
 * @stable
 */
export class NavigationStart {
  // TODO: vsavkin: make internal
  constructor(
      /** @docsNotRequired */
      public id: number,
      /** @docsNotRequired */
      public url: string) {}

  /** @docsNotRequired */
  toString(): string { return `NavigationStart(id: ${this.id}, url: '${this.url}')`; }
}

/**
 * @whatItDoes Represents an event triggered when a navigation ends successfully.
 *
 * @stable
 */
export class NavigationEnd {
  // TODO: vsavkin: make internal
  constructor(
      /** @docsNotRequired */
      public id: number,
      /** @docsNotRequired */
      public url: string,
      /** @docsNotRequired */
      public urlAfterRedirects: string) {}

  /** @docsNotRequired */
  toString(): string {
    return `NavigationEnd(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}')`;
  }
}

/**
 * @whatItDoes Represents an event triggered when a navigation is canceled.
 *
 * @stable
 */
export class NavigationCancel {
  // TODO: vsavkin: make internal
  constructor(
      /** @docsNotRequired */
      public id: number,
      /** @docsNotRequired */
      public url: string,
      /** @docsNotRequired */
      public reason: string) {}

  /** @docsNotRequired */
  toString(): string { return `NavigationCancel(id: ${this.id}, url: '${this.url}')`; }
}

/**
 * @whatItDoes Represents an event triggered when a navigation fails due to an unexpected error.
 *
 * @stable
 */
export class NavigationError {
  // TODO: vsavkin: make internal
  constructor(
      /** @docsNotRequired */
      public id: number,
      /** @docsNotRequired */
      public url: string,
      /** @docsNotRequired */
      public error: any) {}

  /** @docsNotRequired */
  toString(): string {
    return `NavigationError(id: ${this.id}, url: '${this.url}', error: ${this.error})`;
  }
}

/**
 * @whatItDoes Represents an event triggered when routes are recognized.
 *
 * @stable
 */
export class RoutesRecognized {
  // TODO: vsavkin: make internal
  constructor(
      /** @docsNotRequired */
      public id: number,
      /** @docsNotRequired */
      public url: string,
      /** @docsNotRequired */
      public urlAfterRedirects: string,
      /** @docsNotRequired */
      public state: RouterStateSnapshot) {}

  /** @docsNotRequired */
  toString(): string {
    return `RoutesRecognized(id: ${this.id}, url: '${this.url}', urlAfterRedirects: '${this.urlAfterRedirects}', state: ${this.state})`;
  }
}

/**
 * @whatItDoes Represents an event triggered when route is lazy loaded.
 *
 * @experimental
 */
export class RouteConfigLoaded {
  constructor(public route: Route) {}

  toString(): string { return `RouteConfigLoaded(path: ${this.route.path})`; }
}

/**
 * @whatItDoes Represents a router event.
 *
 * Please see {@link NavigationStart}, {@link NavigationEnd}, {@link NavigationCancel}, {@link
  * NavigationError}, {@link RoutesRecognized}, {@link RouteConfigLoaded} for more information.
 *
 * @stable
 */
export type Event = NavigationStart | NavigationEnd | NavigationCancel | NavigationError |
    RoutesRecognized | RouteConfigLoaded;
