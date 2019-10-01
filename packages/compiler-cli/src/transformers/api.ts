/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {GeneratedFile, ParseSourceSpan, Position} from '@angular/compiler';
import * as ts from 'typescript';

export const DEFAULT_ERROR_CODE = 100;
export const UNKNOWN_ERROR_CODE = 500;
export const SOURCE = 'angular' as 'angular';

export interface DiagnosticMessageChain {
  messageText: string;
  position?: Position;
  next?: DiagnosticMessageChain;
}

export interface Diagnostic {
  messageText: string;
  span?: ParseSourceSpan;
  position?: Position;
  chain?: DiagnosticMessageChain;
  category: ts.DiagnosticCategory;
  code: number;
  source: 'angular';
}

export function isTsDiagnostic(diagnostic: any): diagnostic is ts.Diagnostic {
  return diagnostic != null && diagnostic.source !== 'angular';
}

export function isNgDiagnostic(diagnostic: any): diagnostic is Diagnostic {
  return diagnostic != null && diagnostic.source === 'angular';
}

export interface CompilerOptions extends ts.CompilerOptions {
  // NOTE: These comments and aio/content/guides/aot-compiler.md should be kept in sync.

  // Write statistics about compilation (e.g. total time, ...)
  // Note: this is the --diagnostics command line option from TS (which is @internal
  // on ts.CompilerOptions interface).
  diagnostics?: boolean;

  // Absolute path to a directory where generated file structure is written.
  // If unspecified, generated files will be written alongside sources.
  // @deprecated - no effect
  genDir?: string;

  // Path to the directory containing the tsconfig.json file.
  basePath?: string;

  // Don't produce .metadata.json files (they don't work for bundled emit with --out)
  skipMetadataEmit?: boolean;

  // Produce an error if the metadata written for a class would produce an error if used.
  strictMetadataEmit?: boolean;

  // Don't produce .ngfactory.js or .ngstyle.js files
  skipTemplateCodegen?: boolean;

  // Always report errors when the type of a parameter supplied whose injection type cannot
  // be determined. When this value option is not provided or is `false`, constructor
  // parameters of classes marked with `@Injectable` whose type cannot be resolved will
  // produce a warning. With this option `true`, they produce an error. When this option is
  // not provided is treated as if it were `false`. In Angular 6.0, if this option is not
  // provided, it will be treated as `true`.
  strictInjectionParameters?: boolean;

  // Whether to generate a flat module index of the given name and the corresponding
  // flat module metadata. This option is intended to be used when creating flat
  // modules similar to how `@angular/core` and `@angular/common` are packaged.
  // When this option is used the `package.json` for the library should referred to the
  // generated flat module index instead of the library index file. When using this
  // option only one .metadata.json file is produced that contains all the metadata
  // necessary for symbols exported from the library index.
  // In the generated .ngfactory.ts files flat module index is used to import symbols
  // includes both the public API from the library index as well as shrowded internal
  // symbols.
  // By default the .ts file supplied in the `files` files field is assumed to be
  // library index. If more than one is specified, uses `libraryIndex` to select the
  // file to use. If more than on .ts file is supplied and no `libraryIndex` is supplied
  // an error is produced.
  // A flat module index .d.ts and .js will be created with the given `flatModuleOutFile`
  // name in the same location as the library index .d.ts file is emitted.
  // For example, if a library uses `public_api.ts` file as the library index of the
  // module the `tsconfig.json` `files` field would be `["public_api.ts"]`. The
  // `flatModuleOutFile` options could then be set to, for example `"index.js"`, which
  // produces `index.d.ts` and  `index.metadata.json` files. The library's
  // `package.json`'s `module` field would be `"index.js"` and the `typings` field would
  // be `"index.d.ts"`.
  flatModuleOutFile?: string;

  // Preferred module id to use for importing flat module. References generated by `ngc`
  // will use this module name when importing symbols from the flat module. This is only
  // meaningful when `flatModuleOutFile` is also supplied. It is otherwise ignored.
  flatModuleId?: string;

  // A prefix to insert in generated private symbols, e.g. for "my_prefix_" we
  // would generate private symbols named like `ɵmy_prefix_a`.
  flatModulePrivateSymbolPrefix?: string;

  // Whether to generate code for library code.
  // If true, produce .ngfactory.ts and .ngstyle.ts files for .d.ts inputs.
  // Default is true.
  generateCodeForLibraries?: boolean;

  // Whether to enable all type checks for templates.
  // This will be true be default in Angular 6.
  fullTemplateTypeCheck?: boolean;

  // Whether to use the CompilerHost's fileNameToModuleName utility (if available) to generate
  // import module specifiers. This is false by default, and exists to support running ngtsc
  // within Google. This option is internal and is used by the ng_module.bzl rule to switch
  // behavior between Bazel and Blaze.
  _useHostForImportGeneration?: boolean;

  // Insert JSDoc type annotations needed by Closure Compiler
  annotateForClosureCompiler?: boolean;

  // Modify how angular annotations are emitted to improve tree-shaking.
  // Default is static fields.
  // decorators: Leave the Decorators in-place. This makes compilation faster.
  //             TypeScript will emit calls to the __decorate helper.
  //             `--emitDecoratorMetadata` can be used for runtime reflection.
  //             However, the resulting code will not properly tree-shake.
  // static fields: Replace decorators with a static field in the class.
  //                Allows advanced tree-shakers like Closure Compiler to remove
  //                unused classes.
  annotationsAs?: 'decorators'|'static fields';

  // Print extra information while running the compiler
  trace?: boolean;

  // Whether to enable lowering expressions lambdas and expressions in a reference value
  // position.
  disableExpressionLowering?: boolean;

  // Disable TypeScript Version Check.
  disableTypeScriptVersionCheck?: boolean;

  // Locale of the application
  i18nOutLocale?: string;
  // Export format (xlf, xlf2 or xmb)
  i18nOutFormat?: string;
  // Path to the extracted message file
  i18nOutFile?: string;

  // Import format if different from `i18nFormat`
  i18nInFormat?: string;
  // Locale of the imported translations
  i18nInLocale?: string;
  // Path to the translation file
  i18nInFile?: string;
  // How to handle missing messages
  i18nInMissingTranslations?: 'error'|'warning'|'ignore';
  // Whether translation variable name should contain external message id
  // (used by Closure Compiler's output of `goog.getMsg` for transition period)
  i18nUseExternalIds?: boolean;

  /**
   * Render `$localize` message ids with the specified legacy format (xlf, xlf2 or xmb).
   *
   * Use this option when use are using the `$localize` based localization messages but
   * have not migrated the translation files to use the new `$localize` message id format.
   *
   * @deprecated
   * `i18nLegacyMessageIdFormat` should only be used while migrating from legacy message id
   * formatted translation files and will be removed at the same time as ViewEngine support is
   * removed.
   */
  i18nLegacyMessageIdFormat?: string;

  // Whether to remove blank text nodes from compiled templates. It is `false` by default starting
  // from Angular 6.
  preserveWhitespaces?: boolean;

  /** generate all possible generated files  */
  allowEmptyCodegenFiles?: boolean;

  /**
   * Whether to generate .ngsummary.ts files that allow to use AOTed artifacts
   * in JIT mode. This is off by default.
   */
  enableSummariesForJit?: boolean;

  /**
   * Whether to replace the `templateUrl` and `styleUrls` property in all
   * @Component decorators with inlined contents in `template` and `styles`
   * properties.
   * When enabled, the .js output of ngc will have no lazy-loaded `templateUrl`
   * or `styleUrl`s. Note that this requires that resources be available to
   * load statically at compile-time.
   */
  enableResourceInlining?: boolean;

  /**
   * Tells the compiler to generate definitions using the Render3 style code generation.
   * This option defaults to `true`.
   *
   * Acceptable values are as follows:
   *
   * `false` - run ngc normally
   * `true` - run the ngtsc compiler instead of the normal ngc compiler
   * `ngtsc` - alias for `true`
   *
   * @publicApi
   */
  enableIvy?: boolean|'ngtsc';

  /** @internal */
  collectAllErrors?: boolean;

  /** An option to enable ngtsc's internal performance tracing.
   *
   * This should be a path to a JSON file where trace information will be written. An optional 'ts:'
   * prefix will cause the trace to be written via the TS host instead of directly to the filesystem
   * (not all hosts support this mode of operation).
   *
   * This is currently not exposed to users as the trace format is still unstable.
   *
   * @internal */
  tracePerformance?: string;

  /**
   * Whether NGC should generate re-exports for external symbols which are referenced
   * in Angular metadata (e.g. @Component, @Inject, @ViewChild). This can be enabled in
   * order to avoid dynamically generated module dependencies which can break strict
   * dependency enforcements. This is not enabled by default.
   * Read more about this here: https://github.com/angular/angular/issues/25644.
   */
  createExternalSymbolFactoryReexports?: boolean;

  /**
   * Turn on template type-checking in the Ivy compiler.
   *
   * This is an internal flag being used to roll out template type-checking in ngtsc. Turning it on
   * by default before it's ready might break other users attempting to test the new compiler's
   * behavior.
   *
   * @internal
   */
  ivyTemplateTypeCheck?: boolean;
}

export interface CompilerHost extends ts.CompilerHost {
  /**
   * Converts a module name that is used in an `import` to a file path.
   * I.e. `path/to/containingFile.ts` containing `import {...} from 'module-name'`.
   */
  moduleNameToFileName?(moduleName: string, containingFile: string): string|null;
  /**
   * Converts a file path to a module name that can be used as an `import ...`
   * I.e. `path/to/importedFile.ts` should be imported by `path/to/containingFile.ts`.
   */
  fileNameToModuleName?(importedFilePath: string, containingFilePath: string): string;
  /**
   * Converts a file path for a resource that is used in a source file or another resource
   * into a filepath.
   */
  resourceNameToFileName?(resourceName: string, containingFilePath: string): string|null;
  /**
   * Converts a file name into a representation that should be stored in a summary file.
   * This has to include changing the suffix as well.
   * E.g.
   * `some_file.ts` -> `some_file.d.ts`
   *
   * @param referringSrcFileName the soure file that refers to fileName
   */
  toSummaryFileName?(fileName: string, referringSrcFileName: string): string;
  /**
   * Converts a fileName that was processed by `toSummaryFileName` back into a real fileName
   * given the fileName of the library that is referrig to it.
   */
  fromSummaryFileName?(fileName: string, referringLibFileName: string): string;
  /**
   * Load a referenced resource either statically or asynchronously. If the host returns a
   * `Promise<string>` it is assumed the user of the corresponding `Program` will call
   * `loadNgStructureAsync()`. Returning  `Promise<string>` outside `loadNgStructureAsync()` will
   * cause a diagnostics diagnostic error or an exception to be thrown.
   */
  readResource?(fileName: string): Promise<string>|string;
  /**
   * Produce an AMD module name for the source file. Used in Bazel.
   *
   * An AMD module can have an arbitrary name, so that it is require'd by name
   * rather than by path. See http://requirejs.org/docs/whyamd.html#namedmodules
   */
  amdModuleName?(sf: ts.SourceFile): string|undefined;

  /**
   * Get the absolute paths to the changed files that triggered the current compilation
   * or `undefined` if this is not an incremental build.
   */
  getModifiedResourceFiles?(): Set<string>|undefined;
}

export enum EmitFlags {
  DTS = 1 << 0,
  JS = 1 << 1,
  Metadata = 1 << 2,
  I18nBundle = 1 << 3,
  Codegen = 1 << 4,

  Default = DTS | JS | Codegen,
  All = DTS | JS | Metadata | I18nBundle | Codegen,
}

export interface CustomTransformers {
  beforeTs?: ts.TransformerFactory<ts.SourceFile>[];
  afterTs?: ts.TransformerFactory<ts.SourceFile>[];
}

export interface TsEmitArguments {
  program: ts.Program;
  host: CompilerHost;
  options: CompilerOptions;
  targetSourceFile?: ts.SourceFile;
  writeFile?: ts.WriteFileCallback;
  cancellationToken?: ts.CancellationToken;
  emitOnlyDtsFiles?: boolean;
  customTransformers?: ts.CustomTransformers;
}

export interface TsEmitCallback { (args: TsEmitArguments): ts.EmitResult; }
export interface TsMergeEmitResultsCallback { (results: ts.EmitResult[]): ts.EmitResult; }

export interface LibrarySummary {
  fileName: string;
  text: string;
  sourceFile?: ts.SourceFile;
}

export interface LazyRoute {
  route: string;
  module: {name: string, filePath: string};
  referencedModule: {name: string, filePath: string};
}

export interface Program {
  /**
   * Retrieve the TypeScript program used to produce semantic diagnostics and emit the sources.
   *
   * Angular structural information is required to produce the program.
   */
  getTsProgram(): ts.Program;

  /**
   * Retrieve options diagnostics for the TypeScript options used to create the program. This is
   * faster than calling `getTsProgram().getOptionsDiagnostics()` since it does not need to
   * collect Angular structural information to produce the errors.
   */
  getTsOptionDiagnostics(cancellationToken?: ts.CancellationToken): ReadonlyArray<ts.Diagnostic>;

  /**
   * Retrieve options diagnostics for the Angular options used to create the program.
   */
  getNgOptionDiagnostics(cancellationToken?: ts.CancellationToken):
      ReadonlyArray<ts.Diagnostic|Diagnostic>;

  /**
   * Retrieve the syntax diagnostics from TypeScript. This is faster than calling
   * `getTsProgram().getSyntacticDiagnostics()` since it does not need to collect Angular structural
   * information to produce the errors.
   */
  getTsSyntacticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken):
      ReadonlyArray<ts.Diagnostic>;

  /**
   * Retrieve the diagnostics for the structure of an Angular application is correctly formed.
   * This includes validating Angular annotations and the syntax of referenced and imbedded HTML
   * and CSS.
   *
   * Note it is important to displaying TypeScript semantic diagnostics along with Angular
   * structural diagnostics as an error in the program structure might cause errors detected in
   * semantic analysis and a semantic error might cause errors in specifying the program structure.
   *
   * Angular structural information is required to produce these diagnostics.
   */
  getNgStructuralDiagnostics(cancellationToken?: ts.CancellationToken): ReadonlyArray<Diagnostic>;

  /**
   * Retrieve the semantic diagnostics from TypeScript. This is equivalent to calling
   * `getTsProgram().getSemanticDiagnostics()` directly and is included for completeness.
   */
  getTsSemanticDiagnostics(sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken):
      ReadonlyArray<ts.Diagnostic>;

  /**
   * Retrieve the Angular semantic diagnostics.
   *
   * Angular structural information is required to produce these diagnostics.
   */
  getNgSemanticDiagnostics(fileName?: string, cancellationToken?: ts.CancellationToken):
      ReadonlyArray<ts.Diagnostic|Diagnostic>;

  /**
   * Load Angular structural information asynchronously. If this method is not called then the
   * Angular structural information, including referenced HTML and CSS files, are loaded
   * synchronously. If the supplied Angular compiler host returns a promise from `loadResource()`
   * will produce a diagnostic error message or, `getTsProgram()` or `emit` to throw.
   */
  loadNgStructureAsync(): Promise<void>;

  /**
   * Returns the lazy routes in the program.
   * @param entryRoute A reference to an NgModule like `someModule#name`. If given,
   *              will recursively analyze routes starting from this symbol only.
   *              Otherwise will list all routes for all NgModules in the program/
   */
  listLazyRoutes(entryRoute?: string): LazyRoute[];

  /**
   * Emit the files requested by emitFlags implied by the program.
   *
   * Angular structural information is required to emit files.
   */
  emit({emitFlags, cancellationToken, customTransformers, emitCallback,
        mergeEmitResultsCallback}?: {
    emitFlags?: EmitFlags,
    cancellationToken?: ts.CancellationToken,
    customTransformers?: CustomTransformers,
    emitCallback?: TsEmitCallback,
    mergeEmitResultsCallback?: TsMergeEmitResultsCallback
  }): ts.EmitResult;

  /**
   * Returns the .d.ts / .ngsummary.json / .ngfactory.d.ts files of libraries that have been emitted
   * in this program or previous programs with paths that emulate the fact that these libraries
   * have been compiled before with no outDir.
   */
  getLibrarySummaries(): Map<string, LibrarySummary>;

  /**
   * @internal
   */
  getEmittedGeneratedFiles(): Map<string, GeneratedFile>;

  /**
   * @internal
   */
  getEmittedSourceFiles(): Map<string, ts.SourceFile>;
}
