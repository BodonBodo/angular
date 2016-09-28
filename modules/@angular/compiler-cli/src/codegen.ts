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
import {Component, NgModule, ViewEncapsulation} from '@angular/core';
import {AngularCompilerOptions, NgcCliOptions} from '@angular/tsc-wrapped';
import * as path from 'path';
import * as ts from 'typescript';

import {PathMappedReflectorHost} from './path_mapped_reflector_host';
import {CompileMetadataResolver, DirectiveNormalizer, DomElementSchemaRegistry, HtmlParser, Lexer, NgModuleCompiler, Parser, StyleCompiler, TemplateParser, TypeScriptEmitter, ViewCompiler} from './private_import_compiler';
import {Console} from './private_import_core';
import {ReflectorHost, ReflectorHostContext} from './reflector_host';
import {StaticAndDynamicReflectionCapabilities} from './static_reflection_capabilities';
import {StaticReflector, StaticSymbol} from './static_reflector';

const nodeFs = require('fs');

const GENERATED_FILES = /\.ngfactory\.ts$|\.css\.ts$|\.css\.shim\.ts$/;
const GENERATED_OR_DTS_FILES = /\.d\.ts$|\.ngfactory\.ts$|\.css\.ts$|\.css\.shim\.ts$/;

const PREAMBLE = `/**
 * This file is generated by the Angular 2 template compiler.
 * Do not edit.
 */
 /* tslint:disable */

`;

export class CodeGenerator {
  constructor(
      private options: AngularCompilerOptions, private program: ts.Program,
      public host: ts.CompilerHost, private staticReflector: StaticReflector,
      private compiler: compiler.OfflineCompiler, private reflectorHost: ReflectorHost) {}

  private readFileMetadata(absSourcePath: string): FileMetadata {
    const moduleMetadata = this.staticReflector.getModuleMetadata(absSourcePath);
    const result: FileMetadata = {components: [], ngModules: [], fileUrl: absSourcePath};
    if (!moduleMetadata) {
      console.log(`WARNING: no metadata found for ${absSourcePath}`);
      return result;
    }
    const metadata = moduleMetadata['metadata'];
    const symbols = metadata && Object.keys(metadata);
    if (!symbols || !symbols.length) {
      return result;
    }
    for (const symbol of symbols) {
      if (metadata[symbol] && metadata[symbol].__symbolic == 'error') {
        // Ignore symbols that are only included to record error information.
        continue;
      }
      const staticType = this.reflectorHost.findDeclaration(absSourcePath, symbol, absSourcePath);
      const annotations = this.staticReflector.annotations(staticType);
      annotations.forEach((annotation) => {
        if (annotation instanceof NgModule) {
          result.ngModules.push(staticType);
        } else if (annotation instanceof Component) {
          result.components.push(staticType);
        }
      });
    }
    return result;
  }

  // Write codegen in a directory structure matching the sources.
  private calculateEmitPath(filePath: string): string {
    let root = this.options.basePath;
    for (let eachRootDir of this.options.rootDirs || []) {
      if (this.options.trace) {
        console.log(`Check if ${filePath} is under rootDirs element ${eachRootDir}`);
      }
      if (path.relative(eachRootDir, filePath).indexOf('.') !== 0) {
        root = eachRootDir;
      }
    }

    // transplant the codegen path to be inside the `genDir`
    var relativePath: string = path.relative(root, filePath);
    while (relativePath.startsWith('..' + path.sep)) {
      // Strip out any `..` path such as: `../node_modules/@foo` as we want to put everything
      // into `genDir`.
      relativePath = relativePath.substr(3);
    }
    return path.join(this.options.genDir, relativePath);
  }

  codegen(): Promise<any> {
    // Compare with false since the default should be true
    const skipFileNames = (this.options.generateCodeForLibraries === false) ?
        GENERATED_OR_DTS_FILES :
        GENERATED_FILES;
    let filePaths = this.program.getSourceFiles()
                        .filter(sf => !skipFileNames.test(sf.fileName))
                        .map(sf => this.reflectorHost.getCanonicalFileName(sf.fileName));
    const fileMetas = filePaths.map((filePath) => this.readFileMetadata(filePath));
    const ngModules = fileMetas.reduce((ngModules, fileMeta) => {
      ngModules.push(...fileMeta.ngModules);
      return ngModules;
    }, <StaticSymbol[]>[]);
    const analyzedNgModules = this.compiler.analyzeModules(ngModules);
    return Promise.all(fileMetas.map(
        (fileMeta) =>
            this.compiler
                .compile(
                    fileMeta.fileUrl, analyzedNgModules, fileMeta.components, fileMeta.ngModules)
                .then((generatedModules) => {
                  generatedModules.forEach((generatedModule) => {
                    const sourceFile = this.program.getSourceFile(fileMeta.fileUrl);
                    const emitPath = this.calculateEmitPath(generatedModule.moduleUrl);
                    this.host.writeFile(
                        emitPath, PREAMBLE + generatedModule.source, false, () => {}, [sourceFile]);
                  });
                })));
  }

  static create(
      options: AngularCompilerOptions, cliOptions: NgcCliOptions, program: ts.Program,
      compilerHost: ts.CompilerHost, reflectorHostContext?: ReflectorHostContext,
      resourceLoader?: compiler.ResourceLoader, reflectorHost?: ReflectorHost): CodeGenerator {
    resourceLoader = resourceLoader || {
      get: (s: string) => {
        if (!compilerHost.fileExists(s)) {
          // TODO: We should really have a test for error cases like this!
          throw new Error(`Compilation failed. Resource file not found: ${s}`);
        }
        return Promise.resolve(compilerHost.readFile(s));
      }
    };
    const transFile = cliOptions.i18nFile;
    const locale = cliOptions.locale;
    let transContent: string = '';
    if (transFile) {
      if (!locale) {
        throw new Error(
            `The translation file (${transFile}) locale must be provided. Use the --locale option.`);
      }
      transContent = nodeFs.readFileSync(transFile, 'utf8');
    }

    const urlResolver: compiler.UrlResolver = compiler.createOfflineCompileUrlResolver();
    if (!reflectorHost) {
      const usePathMapping = !!options.rootDirs && options.rootDirs.length > 0;
      reflectorHost = usePathMapping ?
          new PathMappedReflectorHost(program, compilerHost, options, reflectorHostContext) :
          new ReflectorHost(program, compilerHost, options, reflectorHostContext);
    }
    const staticReflector = new StaticReflector(reflectorHost);
    StaticAndDynamicReflectionCapabilities.install(staticReflector);
    const htmlParser =
        new compiler.I18NHtmlParser(new HtmlParser(), transContent, cliOptions.i18nFormat);
    const config = new compiler.CompilerConfig({
      genDebugInfo: options.debug === true,
      defaultEncapsulation: ViewEncapsulation.Emulated,
      logBindingUpdate: false,
      useJit: false
    });
    const normalizer = new DirectiveNormalizer(resourceLoader, urlResolver, htmlParser, config);
    const expressionParser = new Parser(new Lexer());
    const elementSchemaRegistry = new DomElementSchemaRegistry();
    const console = new Console();
    const tmplParser =
        new TemplateParser(expressionParser, elementSchemaRegistry, htmlParser, console, []);
    const resolver = new CompileMetadataResolver(
        new compiler.NgModuleResolver(staticReflector),
        new compiler.DirectiveResolver(staticReflector), new compiler.PipeResolver(staticReflector),
        elementSchemaRegistry, staticReflector);
    // TODO(vicb): do not pass cliOptions.i18nFormat here
    const offlineCompiler = new compiler.OfflineCompiler(
        resolver, normalizer, tmplParser, new StyleCompiler(urlResolver), new ViewCompiler(config),
        new NgModuleCompiler(), new TypeScriptEmitter(reflectorHost), cliOptions.locale,
        cliOptions.i18nFormat);

    return new CodeGenerator(
        options, program, compilerHost, staticReflector, offlineCompiler, reflectorHost);
  }
}

interface FileMetadata {
  fileUrl: string;
  components: StaticSymbol[];
  ngModules: StaticSymbol[];
}
