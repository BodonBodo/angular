/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * Transform template html and css into executable code.
 * Intended to be used in a build step.
 */
import * as compiler from '@angular/compiler';
import {MissingTranslationStrategy} from '@angular/core';
import {AngularCompilerOptions, NgcCliOptions} from '@angular/tsc-wrapped';
import {readFileSync} from 'fs';
import * as ts from 'typescript';

import {CompilerHost, CompilerHostContext, ModuleResolutionHostAdapter} from './compiler_host';
import {PathMappedCompilerHost} from './path_mapped_compiler_host';

const GENERATED_META_FILES = /\.json$/;

const PREAMBLE = `/**
 * @fileoverview This file is generated by the Angular template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties,missingOverride}
 */
 /* tslint:disable */

`;

export class CodeGenerator {
  constructor(
      private options: AngularCompilerOptions, private program: ts.Program,
      public host: ts.CompilerHost, private compiler: compiler.AotCompiler,
      private ngCompilerHost: CompilerHost) {}

  codegen(): Promise<string[]> {
    return this.compiler
        .analyzeModulesAsync(this.program.getSourceFiles().map(
            sf => this.ngCompilerHost.getCanonicalFileName(sf.fileName)))
        .then(analyzedModules => this.emit(analyzedModules));
  }

  codegenSync(): string[] {
    const analyzed = this.compiler.analyzeModulesSync(this.program.getSourceFiles().map(
        sf => this.ngCompilerHost.getCanonicalFileName(sf.fileName)));
    return this.emit(analyzed);
  }

  private emit(analyzedModules: compiler.NgAnalyzedModules) {
    const generatedModules = this.compiler.emitAllImpls(analyzedModules);
    return generatedModules.map(generatedModule => {
      const sourceFile = this.program.getSourceFile(generatedModule.srcFileUrl);
      const emitPath = this.ngCompilerHost.calculateEmitPath(generatedModule.genFileUrl);
      const source = generatedModule.source || compiler.toTypeScript(generatedModule, PREAMBLE);
      this.host.writeFile(emitPath, source, false, () => {}, [sourceFile]);
      return emitPath;
    });
  }

  static create(
      options: AngularCompilerOptions, cliOptions: NgcCliOptions, program: ts.Program,
      tsCompilerHost: ts.CompilerHost, compilerHostContext?: CompilerHostContext,
      ngCompilerHost?: CompilerHost): CodeGenerator {
    if (!ngCompilerHost) {
      const usePathMapping = !!options.rootDirs && options.rootDirs.length > 0;
      const context = compilerHostContext || new ModuleResolutionHostAdapter(tsCompilerHost);
      ngCompilerHost = usePathMapping ? new PathMappedCompilerHost(program, options, context) :
                                        new CompilerHost(program, options, context);
    }
    let transContent: string = '';
    if (cliOptions.i18nFile) {
      if (!cliOptions.locale) {
        throw new Error(
            `The translation file (${cliOptions.i18nFile}) locale must be provided. Use the --locale option.`);
      }
      transContent = readFileSync(cliOptions.i18nFile, 'utf8');
    }
    let missingTranslation = MissingTranslationStrategy.Warning;
    if (cliOptions.missingTranslation) {
      switch (cliOptions.missingTranslation) {
        case 'error':
          missingTranslation = MissingTranslationStrategy.Error;
          break;
        case 'warning':
          missingTranslation = MissingTranslationStrategy.Warning;
          break;
        case 'ignore':
          missingTranslation = MissingTranslationStrategy.Ignore;
          break;
        default:
          throw new Error(
              `Unknown option for missingTranslation (${cliOptions.missingTranslation}). Use either error, warning or ignore.`);
      }
    }
    if (!transContent) {
      missingTranslation = MissingTranslationStrategy.Ignore
    }
    const {compiler: aotCompiler} = compiler.createAotCompiler(ngCompilerHost, {
      translations: transContent,
      i18nFormat: cliOptions.i18nFormat,
      locale: cliOptions.locale, missingTranslation,
      enableLegacyTemplate: options.enableLegacyTemplate !== false,
      enableSummariesForJit: options.enableSummariesForJit !== false,
    });
    return new CodeGenerator(options, program, tsCompilerHost, aotCompiler, ngCompilerHost);
  }
}
