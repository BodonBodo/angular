/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ERROR_ORIGINAL_ERROR, getDebugContext, getErrorLogger, getOriginalError} from './errors';



/**
 * @whatItDoes Provides a hook for centralized exception handling.
 *
 * @description
 *
 * The default implementation of `ErrorHandler` prints error messages to the `console`. To
 * intercept error handling, write a custom exception handler that replaces this default as
 * appropriate for your app.
 *
 * ### Example
 *
 * ```
 * class MyErrorHandler implements ErrorHandler {
 *   handleError(error) {
 *     // do something with the exception
 *   }
 * }
 *
 * @NgModule({
 *   providers: [{provide: ErrorHandler, useClass: MyErrorHandler}]
 * })
 * class MyModule {}
 * ```
 *
 * @stable
 */
export class ErrorHandler {
  /**
   * @internal
   */
  _console: Console = console;

  constructor(
      /**
       * @deprecated since v4.0 parameter no longer has an effect, as ErrorHandler will never
       * rethrow.
       */
      deprecatedParameter?: boolean) {}

  handleError(error: any): void {
    const originalError = this._findOriginalError(error);
    const context = this._findContext(error);
    // Note: Browser consoles show the place from where console.error was called.
    // We can use this to give users additional information about the error.
    const errorLogger = getErrorLogger(error);

    errorLogger(this._console, `ERROR`, error);
    if (originalError) {
      errorLogger(this._console, `ORIGINAL ERROR`, originalError);
    }
    if (context) {
      errorLogger(this._console, 'ERROR CONTEXT', context);
    }
  }

  /** @internal */
  _findContext(error: any): any {
    if (error) {
      return getDebugContext(error) ? getDebugContext(error) :
                                      this._findContext(getOriginalError(error));
    }

    return null;
  }

  /** @internal */
  _findOriginalError(error: Error): any {
    let e = getOriginalError(error);
    while (e && getOriginalError(e)) {
      e = getOriginalError(e);
    }

    return e;
  }
}

export function wrappedError(message: string, originalError: any): Error {
  const msg =
      `${message} caused by: ${originalError instanceof Error ? originalError.message: originalError }`;
  const error = Error(msg);
  (error as any)[ERROR_ORIGINAL_ERROR] = originalError;
  return error;
}
