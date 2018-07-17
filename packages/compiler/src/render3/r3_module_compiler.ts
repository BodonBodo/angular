/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {StaticSymbol} from '../aot/static_symbol';
import {CompileShallowModuleMetadata, identifierName} from '../compile_metadata';
import {InjectableCompiler} from '../injectable_compiler';
import {mapLiteral} from '../output/map_util';
import * as o from '../output/output_ast';
import {OutputContext} from '../util';

import {R3DependencyMetadata, compileFactoryFunction} from './r3_factory';
import {Identifiers as R3} from './r3_identifiers';
import {convertMetaToOutput, mapToMapExpression} from './util';

export interface R3NgModuleDef {
  expression: o.Expression;
  type: o.Type;
  additionalStatements: o.Statement[];
}

/**
 * Metadata required by the module compiler to generate a `ngModuleDef` for a type.
 */
export interface R3NgModuleMetadata {
  /**
   * An expression representing the module type being compiled.
   */
  type: o.Expression;

  /**
   * An array of expressions representing the bootstrap components specified by the module.
   */
  bootstrap: o.Expression[];

  /**
   * An array of expressions representing the directives and pipes declared by the module.
   */
  declarations: o.Expression[];

  /**
   * An array of expressions representing the imports of the module.
   */
  imports: o.Expression[];

  /**
   * An array of expressions representing the exports of the module.
   */
  exports: o.Expression[];

  /**
   * Whether to emit the selector scope values (declarations, imports, exports) inline into the
   * module definition, or to generate additional statements which patch them on. Inline emission
   * does not allow components to be tree-shaken, but is useful for JIT mode.
   */
  emitInline: boolean;
}

/**
 * Construct an `R3NgModuleDef` for the given `R3NgModuleMetadata`.
 */
export function compileNgModule(meta: R3NgModuleMetadata): R3NgModuleDef {
  const {type: moduleType, bootstrap, declarations, imports, exports} = meta;
  const expression = o.importExpr(R3.defineNgModule).callFn([mapToMapExpression({
    type: moduleType,
    bootstrap: o.literalArr(bootstrap),
    declarations: o.literalArr(declarations),
    imports: o.literalArr(imports),
    exports: o.literalArr(exports),
  })]);

  const type = new o.ExpressionType(o.importExpr(R3.NgModuleDef, [
    new o.ExpressionType(moduleType), tupleTypeOf(declarations), tupleTypeOf(imports),
    tupleTypeOf(exports)
  ]));

  const additionalStatements: o.Statement[] = [];
  return {expression, type, additionalStatements};
}

export interface R3InjectorDef {
  expression: o.Expression;
  type: o.Type;
}

export interface R3InjectorMetadata {
  name: string;
  type: o.Expression;
  deps: R3DependencyMetadata[];
  providers: o.Expression;
  imports: o.Expression;
}

export function compileInjector(meta: R3InjectorMetadata): R3InjectorDef {
  const expression = o.importExpr(R3.defineInjector).callFn([mapToMapExpression({
    factory: compileFactoryFunction({
      name: meta.name,
      fnOrClass: meta.type,
      deps: meta.deps,
      useNew: true,
      injectFn: R3.inject,
    }),
    providers: meta.providers,
    imports: meta.imports,
  })]);
  const type =
      new o.ExpressionType(o.importExpr(R3.InjectorDef, [new o.ExpressionType(meta.type)]));
  return {expression, type};
}

// TODO(alxhub): integrate this with `compileNgModule`. Currently the two are separate operations.
export function compileNgModuleFromRender2(
    ctx: OutputContext, ngModule: CompileShallowModuleMetadata,
    injectableCompiler: InjectableCompiler): void {
  const className = identifierName(ngModule.type) !;

  const rawImports = ngModule.rawImports ? [ngModule.rawImports] : [];
  const rawExports = ngModule.rawExports ? [ngModule.rawExports] : [];

  const injectorDefArg = mapLiteral({
    'factory':
        injectableCompiler.factoryFor({type: ngModule.type, symbol: ngModule.type.reference}, ctx),
    'providers': convertMetaToOutput(ngModule.rawProviders, ctx),
    'imports': convertMetaToOutput([...rawImports, ...rawExports], ctx),
  });

  const injectorDef = o.importExpr(R3.defineInjector).callFn([injectorDefArg]);

  ctx.statements.push(new o.ClassStmt(
      /* name */ className,
      /* parent */ null,
      /* fields */[new o.ClassField(
          /* name */ 'ngInjectorDef',
          /* type */ o.INFERRED_TYPE,
          /* modifiers */[o.StmtModifier.Static],
          /* initializer */ injectorDef, )],
      /* getters */[],
      /* constructorMethod */ new o.ClassMethod(null, [], []),
      /* methods */[]));
}

function accessExportScope(module: o.Expression): o.Expression {
  const selectorScope = new o.ReadPropExpr(module, 'ngModuleDef');
  return new o.ReadPropExpr(selectorScope, 'exported');
}

function tupleTypeOf(exp: o.Expression[]): o.Type {
  const types = exp.map(type => o.typeofExpr(type));
  return exp.length > 0 ? o.expressionType(o.literalArr(types)) : o.NONE_TYPE;
}