/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DOCUMENT} from '@angular/common';
import {Inject, Injectable, Injector, Sanitizer, SecurityContext, forwardRef, ɵBypassType as BypassType, ɵ_sanitizeHtml as _sanitizeHtml, ɵ_sanitizeStyle as _sanitizeStyle, ɵ_sanitizeUrl as _sanitizeUrl, ɵallowSanitizationBypassAndThrow as allowSanitizationBypassOrThrow, ɵbypassSanitizationTrustHtml as bypassSanitizationTrustHtml, ɵbypassSanitizationTrustResourceUrl as bypassSanitizationTrustResourceUrl, ɵbypassSanitizationTrustScript as bypassSanitizationTrustScript, ɵbypassSanitizationTrustStyle as bypassSanitizationTrustStyle, ɵbypassSanitizationTrustUrl as bypassSanitizationTrustUrl, ɵgetSanitizationBypassType as getSanitizationBypassType, ɵunwrapSafeValue as unwrapSafeValue} from '@angular/core';

export {SecurityContext};



/**
 * Marker interface for a value that's safe to use in a particular context.
 *
 * @publicApi
 */
export interface SafeValue {}

/**
 * Marker interface for a value that's safe to use as HTML.
 *
 * @publicApi
 */
export interface SafeHtml extends SafeValue {}

/**
 * Marker interface for a value that's safe to use as style (CSS).
 *
 * @publicApi
 */
export interface SafeStyle extends SafeValue {}

/**
 * Marker interface for a value that's safe to use as JavaScript.
 *
 * @publicApi
 */
export interface SafeScript extends SafeValue {}

/**
 * Marker interface for a value that's safe to use as a URL linking to a document.
 *
 * @publicApi
 */
export interface SafeUrl extends SafeValue {}

/**
 * Marker interface for a value that's safe to use as a URL to load executable code from.
 *
 * @publicApi
 */
export interface SafeResourceUrl extends SafeValue {}

/**
 * DomSanitizer helps preventing Cross Site Scripting Security bugs (XSS) by sanitizing
 * values to be safe to use in the different DOM contexts.
 *
 * For example, when binding a URL in an `<a [href]="someValue">` hyperlink, `someValue` will be
 * sanitized so that an attacker cannot inject e.g. a `javascript:` URL that would execute code on
 * the website.
 *
 * In specific situations, it might be necessary to disable sanitization, for example if the
 * application genuinely needs to produce a `javascript:` style link with a dynamic value in it.
 * Users can bypass security by constructing a value with one of the `bypassSecurityTrust...`
 * methods, and then binding to that value from the template.
 *
 * These situations should be very rare, and extraordinary care must be taken to avoid creating a
 * Cross Site Scripting (XSS) security bug!
 *
 * When using `bypassSecurityTrust...`, make sure to call the method as early as possible and as
 * close as possible to the source of the value, to make it easy to verify no security bug is
 * created by its use.
 *
 * It is not required (and not recommended) to bypass security if the value is safe, e.g. a URL that
 * does not start with a suspicious protocol, or an HTML snippet that does not contain dangerous
 * code. The sanitizer leaves safe values intact.
 *
 * @security Calling any of the `bypassSecurityTrust...` APIs disables Angular's built-in
 * sanitization for the value passed in. Carefully check and audit all values and code paths going
 * into this call. Make sure any user data is appropriately escaped for this security context.
 * For more detail, see the [Security Guide](http://g.co/ng/security).
 *
 * @publicApi
 */
@Injectable({providedIn: 'root', useExisting: forwardRef(() => DomSanitizerImpl)})
export abstract class DomSanitizer implements Sanitizer {
  /**
   * Sanitizes a value for use in the given SecurityContext.
   *
   * If value is trusted for the context, this method will unwrap the contained safe value and use
   * it directly. Otherwise, value will be sanitized to be safe in the given context, for example
   * by replacing URLs that have an unsafe protocol part (such as `javascript:`). The implementation
   * is responsible to make sure that the value can definitely be safely used in the given context.
   */
  abstract sanitize(context: SecurityContext, value: SafeValue|string|null): string|null;

  /**
   * Bypass security and trust the given value to be safe HTML. Only use this when the bound HTML
   * is unsafe (e.g. contains `<script>` tags) and the code should be executed. The sanitizer will
   * leave safe HTML intact, so in most situations this method should not be used.
   *
   * **WARNING:** calling this method with untrusted user data exposes your application to XSS
   * security risks!
   */
  abstract bypassSecurityTrustHtml(value: string): SafeHtml;

  /**
   * Bypass security and trust the given value to be safe style value (CSS).
   *
   * **WARNING:** calling this method with untrusted user data exposes your application to XSS
   * security risks!
   */
  abstract bypassSecurityTrustStyle(value: string): SafeStyle;

  /**
   * Bypass security and trust the given value to be safe JavaScript.
   *
   * **WARNING:** calling this method with untrusted user data exposes your application to XSS
   * security risks!
   */
  abstract bypassSecurityTrustScript(value: string): SafeScript;

  /**
   * Bypass security and trust the given value to be a safe style URL, i.e. a value that can be used
   * in hyperlinks or `<img src>`.
   *
   * **WARNING:** calling this method with untrusted user data exposes your application to XSS
   * security risks!
   */
  abstract bypassSecurityTrustUrl(value: string): SafeUrl;

  /**
   * Bypass security and trust the given value to be a safe resource URL, i.e. a location that may
   * be used to load executable code from, like `<script src>`, or `<iframe src>`.
   *
   * **WARNING:** calling this method with untrusted user data exposes your application to XSS
   * security risks!
   */
  abstract bypassSecurityTrustResourceUrl(value: string): SafeResourceUrl;
}

export function domSanitizerImplFactory(injector: Injector) {
  return new DomSanitizerImpl(injector.get(DOCUMENT));
}

@Injectable({providedIn: 'root', useFactory: domSanitizerImplFactory, deps: [Injector]})
export class DomSanitizerImpl extends DomSanitizer {
  constructor(@Inject(DOCUMENT) private _doc: any) { super(); }

  sanitize(ctx: SecurityContext, value: SafeValue|string|null): string|null {
    if (value == null) return null;
    switch (ctx) {
      case SecurityContext.NONE:
        return value as string;
      case SecurityContext.HTML:
        if (allowSanitizationBypassOrThrow(value, BypassType.Html)) {
          return unwrapSafeValue(value);
        }
        return _sanitizeHtml(this._doc, String(value));
      case SecurityContext.STYLE:
        if (allowSanitizationBypassOrThrow(value, BypassType.Style)) {
          return unwrapSafeValue(value);
        }
        return _sanitizeStyle(value as string);
      case SecurityContext.SCRIPT:
        if (allowSanitizationBypassOrThrow(value, BypassType.Script)) {
          return unwrapSafeValue(value);
        }
        throw new Error('unsafe value used in a script context');
      case SecurityContext.URL:
        const type = getSanitizationBypassType(value);
        if (allowSanitizationBypassOrThrow(value, BypassType.Url)) {
          return unwrapSafeValue(value);
        }
        return _sanitizeUrl(String(value));
      case SecurityContext.RESOURCE_URL:
        if (allowSanitizationBypassOrThrow(value, BypassType.ResourceUrl)) {
          return unwrapSafeValue(value);
        }
        throw new Error(
            'unsafe value used in a resource URL context (see http://g.co/ng/security#xss)');
      default:
        throw new Error(`Unexpected SecurityContext ${ctx} (see http://g.co/ng/security#xss)`);
    }
  }

  bypassSecurityTrustHtml(value: string): SafeHtml { return bypassSanitizationTrustHtml(value); }
  bypassSecurityTrustStyle(value: string): SafeStyle { return bypassSanitizationTrustStyle(value); }
  bypassSecurityTrustScript(value: string): SafeScript {
    return bypassSanitizationTrustScript(value);
  }
  bypassSecurityTrustUrl(value: string): SafeUrl { return bypassSanitizationTrustUrl(value); }
  bypassSecurityTrustResourceUrl(value: string): SafeResourceUrl {
    return bypassSanitizationTrustResourceUrl(value);
  }
}
