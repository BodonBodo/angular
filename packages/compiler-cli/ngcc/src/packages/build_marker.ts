/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AbsoluteFsPath, FileSystem, dirname} from '../../../src/ngtsc/file_system';
import {EntryPointPackageJson, PackageJsonFormatProperties} from './entry_point';

export const NGCC_VERSION = '0.0.0-PLACEHOLDER';

/**
 * Check whether ngcc has already processed a given entry-point format.
 *
 * The entry-point is defined by the package.json contents provided.
 * The format is defined by the provided property name of the path to the bundle in the package.json
 *
 * @param packageJson The parsed contents of the package.json file for the entry-point.
 * @param format The entry-point format property in the package.json to check.
 * @returns true if the entry-point and format have already been processed with this ngcc version.
 * @throws Error if the `packageJson` property is not an object.
 * @throws Error if the entry-point has already been processed with a different ngcc version.
 */
export function hasBeenProcessed(
    packageJson: EntryPointPackageJson, format: PackageJsonFormatProperties,
    entryPointPath: AbsoluteFsPath): boolean {
  if (!packageJson.__processed_by_ivy_ngcc__) {
    return false;
  }
  if (Object.keys(packageJson.__processed_by_ivy_ngcc__)
          .some(property => packageJson.__processed_by_ivy_ngcc__ ![property] !== NGCC_VERSION)) {
    throw new Error(
        'The ngcc compiler has changed since the last ngcc build.\n' +
        `Please completely remove the "node_modules" folder containing "${entryPointPath}" and try again.`);
  }

  return packageJson.__processed_by_ivy_ngcc__[format] === NGCC_VERSION;
}

/**
 * Write a build marker for the given entry-point and format properties, to indicate that they have
 * been compiled by this version of ngcc.
 *
 * @param fs The current file-system being used.
 * @param packageJson The parsed contents of the `package.json` file for the entry-point.
 * @param packageJsonPath The absolute path to the `package.json` file.
 * @param properties The properties in the `package.json` of the formats for which we are writing
 *                   the marker.
 */
export function markAsProcessed(
    fs: FileSystem, packageJson: EntryPointPackageJson, packageJsonPath: AbsoluteFsPath,
    properties: PackageJsonFormatProperties[]) {
  const processed =
      packageJson.__processed_by_ivy_ngcc__ || (packageJson.__processed_by_ivy_ngcc__ = {});

  for (const prop of properties) {
    processed[prop] = NGCC_VERSION;
  }

  const scripts = packageJson.scripts || (packageJson.scripts = {});
  const oldPrepublishOnly = scripts.prepublishOnly;
  const newPrepublishOnly = 'node --eval \"console.error(\'' +
      'ERROR: Trying to publish a package that has been compiled by NGCC. This is not allowed.\\n' +
      'Please delete and rebuild the package, without compiling with NGCC, before attempting to publish.\\n' +
      'Note that NGCC may have been run by importing this package into another project that is being built with Ivy enabled.\\n' +
      '\')\" ' +
      '&& exit 1';

  if (oldPrepublishOnly && (oldPrepublishOnly !== newPrepublishOnly)) {
    scripts.prepublishOnly__ivy_ngcc_bak = oldPrepublishOnly;
  }

  scripts.prepublishOnly = newPrepublishOnly;

  // Just in case this package.json was synthesized due to a custom configuration
  // we will ensure that the path to the containing folder exists before we write the file.
  fs.ensureDir(dirname(packageJsonPath));
  fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
}
