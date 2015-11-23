import {Injectable, Inject, Optional} from 'angular2/core';
import {
  LocationStrategy,
  joinWithSlash,
  APP_BASE_HREF,
  normalizeQueryParams
} from './location_strategy';
import {EventListener} from 'angular2/src/facade/browser';
import {isPresent} from 'angular2/src/facade/lang';
import {PlatformLocation} from './platform_location';

/**
 * `HashLocationStrategy` is a {@link LocationStrategy} used to configure the
 * {@link Location} service to represent its state in the
 * [hash fragment](https://en.wikipedia.org/wiki/Uniform_Resource_Locator#Syntax)
 * of the browser's URL.
 *
 * For instance, if you call `location.go('/foo')`, the browser's URL will become
 * `example.com#/foo`.
 *
 * ### Example
 *
 * ```
 * import {Component, provide} from 'angular2/angular2';
 * import {
 *   ROUTER_DIRECTIVES,
 *   ROUTER_PROVIDERS,
 *   RouteConfig,
 *   Location,
 *   LocationStrategy,
 *   HashLocationStrategy
 * } from 'angular2/router';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @RouteConfig([
 *  {...},
 * ])
 * class AppCmp {
 *   constructor(location: Location) {
 *     location.go('/foo');
 *   }
 * }
 *
 * bootstrap(AppCmp, [
 *   ROUTER_PROVIDERS,
 *   provide(LocationStrategy, {useClass: HashLocationStrategy})
 * ]);
 * ```
 */
@Injectable()
export class HashLocationStrategy extends LocationStrategy {
  private _baseHref: string = '';
  constructor(private _platformLocation: PlatformLocation,
              @Optional() @Inject(APP_BASE_HREF) _baseHref?: string) {
    super();
    if (isPresent(_baseHref)) {
      this._baseHref = _baseHref;
    }
  }

  onPopState(fn: EventListener): void { this._platformLocation.onPopState(fn); }

  getBaseHref(): string { return this._baseHref; }

  path(): string {
    // the hash value is always prefixed with a `#`
    // and if it is empty then it will stay empty
    var path = this._platformLocation.hash;

    // Dart will complain if a call to substring is
    // executed with a position value that extends the
    // length of string.
    return (path.length > 0 ? path.substring(1) : path) +
           normalizeQueryParams(this._platformLocation.search);
  }

  prepareExternalUrl(internal: string): string {
    var url = joinWithSlash(this._baseHref, internal);
    return url.length > 0 ? ('#' + url) : url;
  }

  pushState(state: any, title: string, path: string, queryParams: string) {
    var url = this.prepareExternalUrl(path + normalizeQueryParams(queryParams));
    if (url.length == 0) {
      url = this._platformLocation.pathname;
    }
    this._platformLocation.pushState(state, title, url);
  }

  forward(): void { this._platformLocation.forward(); }

  back(): void { this._platformLocation.back(); }
}
