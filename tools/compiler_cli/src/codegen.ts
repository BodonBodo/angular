/**
 * Transform template html and css into executable code.
 * Intended to be used in a build step.
 */
import * as ts from 'typescript';
import * as path from 'path';

import * as compiler from '@angular/compiler';
import {ViewEncapsulation} from '@angular/core';
import {StaticReflector} from './static_reflector';
import {CompileMetadataResolver} from '@angular/compiler/src/metadata_resolver';
import {HtmlParser} from '@angular/compiler/src/html_parser';
import {DirectiveNormalizer} from '@angular/compiler/src/directive_normalizer';
import {Lexer} from '@angular/compiler/src/expression_parser/lexer';
import {Parser} from '@angular/compiler/src/expression_parser/parser';
import {TemplateParser} from '@angular/compiler/src/template_parser';
import {DomElementSchemaRegistry} from '@angular/compiler/src/schema/dom_element_schema_registry';
import {StyleCompiler} from '@angular/compiler/src/style_compiler';
import {ViewCompiler} from '@angular/compiler/src/view_compiler/view_compiler';
import {TypeScriptEmitter} from '@angular/compiler/src/output/ts_emitter';
import {Parse5DomAdapter} from '@angular/platform-server';

import {MetadataCollector} from 'ts-metadata-collector';
import {NodeReflectorHost} from './reflector_host';

const GENERATED_FILES = /\.ngfactory\.ts$|\.css\.ts$|\.css\.shim\.ts$/;

const PREAMBLE = `/**
 * This file is generated by the Angular 2 template compiler.
 * Do not edit.
 */
`;

// TODO(alexeagle): we end up passing options and ngOptions everywhere.
// Maybe this should extend ts.CompilerOptions so we only need this one.
export interface AngularCompilerOptions {
  // Absolute path to a directory where generated file structure is written
  genDir: string;

  // Path to the directory containing the tsconfig.json file.
  basePath: string;

  // Don't do the template code generation
  skipTemplateCodegen: boolean;

  // Don't produce .metadata.json files (they don't work for bundled emit with --out)
  skipMetadataEmit: boolean;

  // Lookup angular's symbols using the old angular2/... npm namespace.
  legacyPackageLayout: boolean;

  // Print extra information while running the compiler
  trace: boolean;
}

export class CodeGenerator {
  constructor(private options: ts.CompilerOptions, private ngOptions: AngularCompilerOptions,
              private program: ts.Program, public host: ts.CompilerHost,
              private staticReflector: StaticReflector, private resolver: CompileMetadataResolver,
              private compiler: compiler.OfflineCompiler,
              private reflectorHost: NodeReflectorHost) {}

  private generateSource(metadatas: compiler.CompileDirectiveMetadata[]) {
    const normalize = (metadata: compiler.CompileDirectiveMetadata) => {
      const directiveType = metadata.type.runtime;
      const directives = this.resolver.getViewDirectivesMetadata(directiveType);
      const pipes = this.resolver.getViewPipesMetadata(directiveType);
      return new compiler.NormalizedComponentWithViewDirectives(metadata, directives, pipes);
    };

    return this.compiler.compileTemplates(metadatas.map(normalize));
  }

  private readComponents(absSourcePath: string) {
    const result: Promise<compiler.CompileDirectiveMetadata>[] = [];
    const metadata = this.staticReflector.getModuleMetadata(absSourcePath);
    if (!metadata) {
      console.log(`WARNING: no metadata found for ${absSourcePath}`);
      return result;
    }

    const symbols = Object.keys(metadata['metadata']);
    if (!symbols || !symbols.length) {
      return result;
    }
    for (const symbol of symbols) {
      const staticType = this.reflectorHost.findDeclaration(absSourcePath, symbol, absSourcePath);
      let directive: compiler.CompileDirectiveMetadata;
      directive = this.resolver.maybeGetDirectiveMetadata(<any>staticType);

      if (!directive || !directive.isComponent) {
        continue;
      }
      result.push(this.compiler.normalizeDirectiveMetadata(directive));
    }
    return result;
  }

  // Write codegen in a directory structure matching the sources.
  private calculateEmitPath(filePath: string) {
    let root = this.ngOptions.basePath;
    for (let eachRootDir of this.options.rootDirs || []) {
      if (this.ngOptions.trace) {
        console.log(
            `Check if ${filePath} is under rootDirs element ${eachRootDir}`);
      }
      if (path.relative(eachRootDir, filePath).indexOf('.') !== 0) {
        root = eachRootDir;
      }
    }

    return path.join(this.ngOptions.genDir, path.relative(root, filePath));
  }

  // TODO(tbosch): add a cache for shared css files
  // TODO(tbosch): detect cycles!
  private generateStylesheet(filepath: string, shim: boolean): Promise<any> {
    return this.compiler.loadAndCompileStylesheet(filepath, shim, '.ts')
        .then((sourceWithImports) => {
          const emitPath = this.calculateEmitPath(sourceWithImports.source.moduleUrl);
          // TODO(alexeagle): should include the sourceFile to the WriteFileCallback
          this.host.writeFile(emitPath, PREAMBLE + sourceWithImports.source.source, false);
          return Promise.all(
              sourceWithImports.importedUrls.map(url => this.generateStylesheet(url, shim)));
        });
  }

  codegen(): Promise<any> {
    Parse5DomAdapter.makeCurrent();

    const generateOneFile = (absSourcePath: string) =>
        Promise.all(this.readComponents(absSourcePath))
            .then((metadatas: compiler.CompileDirectiveMetadata[]) => {
              if (!metadatas || !metadatas.length) {
                return;
              }
              let stylesheetPromises: Promise<any>[] = [];
              metadatas.forEach((metadata) => {
                let stylesheetPaths = metadata && metadata.template && metadata.template.styleUrls;
                if (stylesheetPaths) {
                  stylesheetPaths.forEach((path) => {
                    stylesheetPromises.push(this.generateStylesheet(
                        path, metadata.template.encapsulation === ViewEncapsulation.Emulated));
                  });
                }
              });
              const generated = this.generateSource(metadatas);
              const sourceFile = this.program.getSourceFile(absSourcePath);
              const emitPath = this.calculateEmitPath(generated.moduleUrl);
              this.host.writeFile(emitPath, PREAMBLE + generated.source, false, () => {},
                                  [sourceFile]);
              return Promise.all(stylesheetPromises);
            })
            .catch((e) => { console.error(e.stack); });
    return Promise.all(
        this.program.getRootFileNames().filter(f => !GENERATED_FILES.test(f)).map(generateOneFile));
  }

  static create(ngOptions: AngularCompilerOptions, program: ts.Program, options: ts.CompilerOptions,
                compilerHost: ts.CompilerHost): CodeGenerator {
    const xhr: compiler.XHR = {get: (s: string) => Promise.resolve(compilerHost.readFile(s))};
    const urlResolver: compiler.UrlResolver = compiler.createOfflineCompileUrlResolver();
    const reflectorHost = new NodeReflectorHost(program, compilerHost, options, ngOptions);
    const staticReflector = new StaticReflector(reflectorHost);
    const htmlParser = new HtmlParser();
    const normalizer = new DirectiveNormalizer(xhr, urlResolver, htmlParser);
    const parser = new Parser(new Lexer());
    const tmplParser = new TemplateParser(parser, new DomElementSchemaRegistry(), htmlParser,
                                          /*console*/ null, []);
    const offlineCompiler = new compiler.OfflineCompiler(
        normalizer, tmplParser, new StyleCompiler(urlResolver),
        new ViewCompiler(new compiler.CompilerConfig(true, true, true)),
        new TypeScriptEmitter(reflectorHost), xhr);
    const resolver = new CompileMetadataResolver(
        new compiler.DirectiveResolver(staticReflector), new compiler.PipeResolver(staticReflector),
        new compiler.ViewResolver(staticReflector), null, null, staticReflector);

    return new CodeGenerator(options, ngOptions, program, compilerHost,
                             staticReflector, resolver, offlineCompiler, reflectorHost);
  }
}
