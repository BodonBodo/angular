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
import {ViewEncapsulation} from '@angular/core';
import {AngularCompilerOptions, NgcCliOptions} from '@angular/tsc-wrapped';
import {readFileSync} from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import {NgHost, NgHostContext} from './ng_host';
import {PathMappedNgHost} from './path_mapped_ng_host';
import {Console} from './private_import_core';

const GENERATED_FILES = /\.ngfactory\.ts$|\.css\.ts$|\.css\.shim\.ts$/;
const GENERATED_OR_DTS_FILES = /\.d\.ts$|\.ngfactory\.ts$|\.css\.ts$|\.css\.shim\.ts$/;

const PREAMBLE = `/**
 * @fileoverview This file is generated by the Angular 2 template compiler.
 * Do not edit.
 * @suppress {suspiciousCode,uselessCode,missingProperties}
 */
 /* tslint:disable */

`;

export class CodeGenerator {
  constructor(
      private options: AngularCompilerOptions, private program: ts.Program,
      public host: ts.CompilerHost, private staticReflector: compiler.StaticReflector,
      private compiler: compiler.AotCompiler, private ngHost: NgHost) {}

  // Write codegen in a directory structure matching the sources.
  private calculateEmitPath(filePath: string): string {
    let root = this.options.basePath;
    for (const eachRootDir of this.options.rootDirs || []) {
      if (this.options.trace) {
        console.log(`Check if ${filePath} is under rootDirs element ${eachRootDir}`);
      }
      if (path.relative(eachRootDir, filePath).indexOf('.') !== 0) {
        root = eachRootDir;
      }
    }

    // transplant the codegen path to be inside the `genDir`
    let relativePath: string = path.relative(root, filePath);
    while (relativePath.startsWith('..' + path.sep)) {
      // Strip out any `..` path such as: `../node_modules/@foo` as we want to put everything
      // into `genDir`.
      relativePath = relativePath.substr(3);
    }

    return path.join(this.options.genDir, relativePath);
  }

  codegen(): Promise<any> {
    return this.compiler
        .compileAll(
            this.program.getSourceFiles().map(sf => this.ngHost.getCanonicalFileName(sf.fileName)))
        .then(generatedModules => {
          generatedModules.forEach(generatedModule => {
            const sourceFile = this.program.getSourceFile(generatedModule.fileUrl);
            const emitPath = this.calculateEmitPath(generatedModule.moduleUrl);
            this.host.writeFile(
                emitPath, PREAMBLE + generatedModule.source, false, () => {}, [sourceFile]);
          });
        });
  }

  static create(
      options: AngularCompilerOptions, cliOptions: NgcCliOptions, program: ts.Program,
      compilerHost: ts.CompilerHost, ngHostContext?: NgHostContext,
      ngHost?: NgHost): CodeGenerator {
    if (!ngHost) {
      const usePathMapping = !!options.rootDirs && options.rootDirs.length > 0;
      ngHost = usePathMapping ?
          new PathMappedNgHost(program, compilerHost, options, ngHostContext) :
          new NgHost(program, compilerHost, options, ngHostContext);
    }
    const transFile = cliOptions.i18nFile;
    const locale = cliOptions.locale;
    let transContent: string = '';
    if (transFile) {
      if (!locale) {
        throw new Error(
            `The translation file (${transFile}) locale must be provided. Use the --locale option.`);
      }
      transContent = readFileSync(transFile, 'utf8');
    }
    const {compiler: aotCompiler, reflector} = compiler.createAotCompiler(ngHost, {
      debug: options.debug === true,
      translations: transContent,
      i18nFormat: cliOptions.i18nFormat,
      locale: cliOptions.locale,
      excludeFilePattern: options.generateCodeForLibraries === false ? GENERATED_OR_DTS_FILES :
                                                                       GENERATED_FILES
    });
    return new CodeGenerator(options, program, compilerHost, reflector, aotCompiler, ngHost);
  }
}

export function extractProgramSymbols(
    program: ts.Program, staticReflector: compiler.StaticReflector, ngHost: NgHost,
    options: AngularCompilerOptions): compiler.StaticSymbol[] {
  return compiler.extractProgramSymbols(
      staticReflector, program.getSourceFiles().map(sf => ngHost.getCanonicalFileName(sf.fileName)),
      {
        excludeFilePattern: options.generateCodeForLibraries === false ? GENERATED_OR_DTS_FILES :
                                                                         GENERATED_FILES
      });
}
