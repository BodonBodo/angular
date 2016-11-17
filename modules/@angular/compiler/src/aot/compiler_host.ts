/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {StaticSymbol} from './static_symbol';

/**
 * The host of the AotCompiler disconnects the implementation from TypeScript / other language
 * services and from underlying file systems.
 */
export interface AotCompilerHost {
  /**
   * Return a ModuleMetadata for the given module.
   * Angular 2 CLI will produce this metadata for a module whenever a .d.ts files is
   * produced and the module has exported variables or classes with decorators. Module metadata can
   * also be produced directly from TypeScript sources by using MetadataCollector in tools/metadata.
   *
   * @param modulePath is a string identifier for a module as an absolute path.
   * @returns the metadata for the given module.
   */
  getMetadataFor(modulePath: string): {[key: string]: any}[];

  /**
   * Converts a module name that is used in an `import` to a file path.
   * I.e.
   * `path/to/containingFile.ts` containing `import {...} from 'module-name'`.
   */
  moduleNameToFileName(moduleName: string, containingFile: string): string;

  /**
   * Converts a file path to a module name that can be used as an `import.
   * I.e. `path/to/importedFile.ts` should be imported by `path/to/containingFile.ts`.
   */
  fileNameToModuleName(importedFile: string, containingFile: string): string;

  /**
   * Loads a resource (e.g. html / css)
   */
  loadResource(path: string): Promise<string>;
}