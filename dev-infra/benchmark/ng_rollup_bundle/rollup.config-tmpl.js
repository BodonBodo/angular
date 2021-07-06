/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// Rollup configuration
// GENERATED BY Bazel

const buildOptimizer =
    require('@angular-devkit/build-optimizer/src/build-optimizer/rollup-plugin.js');
const nodeResolve = require('rollup-plugin-node-resolve');
const sourcemaps = require('rollup-plugin-sourcemaps');
const commonjs = require('rollup-plugin-commonjs');
const path = require('path');
const fs = require('fs');

function log_verbose(...m) {
  // This is a template file so we use __filename to output the actual filename
  if (!!process.env['VERBOSE_LOGS']) console.error(`[${path.basename(__filename)}]`, ...m);
}

// Substitutions from the `ng_rollup_bundle` macro. We want to conditionally toggle
// build optimizer, support optional banner files, and generally respect the current
// compilation mode (i.e. Ivy or View Engine) as that affects module resolution.
const useBuildOptimizer = TMPL_build_optimizer;
const bannerFile = TMPL_banner_file;
const ivyEnabled = 'TMPL_angular_ivy_enabled' === 'True';
// `bazel_version_file` is a substitution that is applied by `@bazel/rollup`.
const stampDataFile = bazel_version_file;

log_verbose(`running with
  cwd: ${process.cwd()}
  useBuildOptimizer: ${useBuildOptimizer}
  bannerFile: ${bannerFile}
  stampDataFile: ${stampDataFile}
  ivyEnabled: ${ivyEnabled}
`);

const plugins = [
  nodeResolve({
    // If Ivy is enabled, we need to make sure that the module resolution prioritizes ngcc
    // processed entry-point fields. Ngcc adds special fields to `package.json` files of
    // modules that have been processed. Prioritizing these fields matches the Angular CLIs
    // behavior for supporting Ivy. We need to support ngcc because `ng_rollup_bundle` rule is
    // shared with other repositories that consume Angular from NPM (w/ ngcc).
    // https://github.com/angular/angular-cli/blob/1a1ceb609b9a87c4021cce3a6f0fc6d167cd09d2/packages/ngtools/webpack/src/angular_compiler_plugin.ts#L918-L920
    mainFields: ivyEnabled ? ['module_ivy_ngcc', 'main_ivy_ngcc', 'module', 'main'] :
                             ['module', 'main'],
    preferBuiltins: true,
  }),
  commonjs({ignoreGlobal: true}),
  sourcemaps(),
];

if (useBuildOptimizer) {
  plugins.unshift(buildOptimizer.default({
    sideEffectFreeModules: [],
  }));
}

module.exports = {
  plugins,
  onwarn: customWarningHandler,
  external: [TMPL_external],
  output: {
    globals: {TMPL_globals},
    banner: extractBannerIfConfigured(),
  }
};

/** Custom warning handler for Rollup. */
function customWarningHandler(warning, defaultHandler) {
  // If rollup is unable to resolve an import, we want to throw an error
  // instead of silently treating the import as external dependency.
  // https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
  if (warning.code === 'UNRESOLVED_IMPORT') {
    throw Error(`Unresolved import: ${warning.message}`);
  }

  defaultHandler(warning);
}

/** Extracts the top-level bundle banner if specified. */
function extractBannerIfConfigured() {
  if (!bannerFile) {
    return undefined;
  }
  let banner = fs.readFileSync(bannerFile, 'utf8');
  if (stampDataFile) {
    const versionTag = fs.readFileSync(stampDataFile, 'utf8')
                           .split('\n')
                           .find(s => s.startsWith('BUILD_SCM_VERSION'));
    // Don't assume BUILD_SCM_VERSION exists
    if (versionTag) {
      const version = versionTag.split(' ')[1].trim();
      banner = banner.replace(/0.0.0-PLACEHOLDER/, version);
    }
  }
  return banner;
}
