/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {readFileSync} from 'fs';
import {dirname, relative, resolve} from 'path';
import {find} from 'shelljs';

import {isDefined} from '../utils';

/**
 * Represents an entry point to a package or sub-package.
 *
 * It exposes the absolute path to the entry point file and a method to get the `.d.ts` file that
 * corresponds to any source file that belongs to the package (assuming source files and `.d.ts`
 * files have the same directory layout).
 */
export class EntryPoint {
  entryFileName: string;
  private entryRoot: string;
  private dtsEntryRoot?: string;

  /**
   * @param packageRoot The absolute path to the root directory that contains the package.
   * @param relativeEntryPath The relative path to the entry point file.
   * @param relativeDtsEntryPath The relative path to the `.d.ts` entry point file.
   */
  constructor(packageRoot: string, relativeEntryPath: string, relativeDtsEntryPath?: string) {
    this.entryFileName = resolve(packageRoot, relativeEntryPath);
    this.entryRoot = dirname(this.entryFileName);

    if (isDefined(relativeDtsEntryPath)) {
      const dtsEntryFileName = resolve(packageRoot, relativeDtsEntryPath);
      this.dtsEntryRoot = dirname(dtsEntryFileName);
    }
  }

  /**
   * Given the absolute path to a source file, return the absolute path to the corresponding `.d.ts`
   * file. Assume that source files and `.d.ts` files have the same directory layout and the names
   * of the `.d.ts` files can be derived by replacing the `.js` extension of the source file with
   * `.d.ts`.
   *
   * @param sourceFileName The absolute path to the source file whose corresponding `.d.ts` file
   *     should be returned.
   *
   * @returns The absolute path to the `.d.ts` file that corresponds to the specified source file.
   */
  getDtsFileNameFor(sourceFileName: string): string {
    if (!isDefined(this.dtsEntryRoot)) {
      throw new Error('No `.d.ts` entry path was specified.');
    }

    const relativeSourcePath = relative(this.entryRoot, sourceFileName);
    const dtsFileName = resolve(this.dtsEntryRoot, relativeSourcePath).replace(/\.js$/, '.d.ts');

    return dtsFileName;
  }
}

/**
 * Match paths to `package.json` files.
 */
const PACKAGE_JSON_REGEX = /\/package\.json$/;

/**
 * Match paths that have a `node_modules` segment at the start or in the middle.
 */
const NODE_MODULES_REGEX = /(?:^|\/)node_modules\//;

/**
 * Search the `rootDirectory` and its subdirectories to find `package.json` files.
 * It ignores node dependencies, i.e. those under `node_modules` directories.
 *
 * @param rootDirectory The directory in which we should search.
 */
export function findAllPackageJsonFiles(rootDirectory: string): string[] {
  // TODO(gkalpak): Investigate whether skipping `node_modules/` directories (instead of traversing
  //                them and filtering out the results later) makes a noticeable difference.
  const paths = Array.from(find(rootDirectory));
  return paths.filter(
      path => PACKAGE_JSON_REGEX.test(path) &&
          !NODE_MODULES_REGEX.test(path.slice(rootDirectory.length)));
}

/**
 * Identify the entry points of a package.
 *
 * @param packageDirectory The absolute path to the root directory that contains the package.
 * @param format The format of the entry points to look for within the package.
 *
 * @returns A collection of `EntryPoint`s that correspond to entry points for the package.
 */
export function getEntryPoints(packageDirectory: string, format: string): EntryPoint[] {
  const packageJsonPaths = findAllPackageJsonFiles(packageDirectory);
  return packageJsonPaths
      .map(packageJsonPath => {
        const entryPointPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const relativeEntryPointPath = entryPointPackageJson[format];
        const relativeDtsEntryPointPath = entryPointPackageJson.typings;
        return relativeEntryPointPath &&
            new EntryPoint(
                   dirname(packageJsonPath), relativeEntryPointPath, relativeDtsEntryPointPath);
      })
      .filter(entryPoint => entryPoint);
}
