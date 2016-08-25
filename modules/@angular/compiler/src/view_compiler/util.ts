/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


import {CompileDirectiveMetadata, CompileTokenMetadata} from '../compile_metadata';
import {isBlank, isPresent} from '../facade/lang';
import {Identifiers, resolveIdentifier} from '../identifiers';
import * as o from '../output/output_ast';
import {createDiTokenExpression} from '../util';

import {CompileView} from './compile_view';

export function getPropertyInView(
    property: o.Expression, callingView: CompileView, definedView: CompileView): o.Expression {
  if (callingView === definedView) {
    return property;
  } else {
    var viewProp: o.Expression = o.THIS_EXPR;
    var currView: CompileView = callingView;
    while (currView !== definedView && isPresent(currView.declarationElement.view)) {
      currView = currView.declarationElement.view;
      viewProp = viewProp.prop('parent');
    }
    if (currView !== definedView) {
      throw new Error(
          `Internal error: Could not calculate a property in a parent view: ${property}`);
    }
    if (property instanceof o.ReadPropExpr) {
      let readPropExpr: o.ReadPropExpr = property;
      // Note: Don't cast for members of the AppView base class...
      if (definedView.fields.some((field) => field.name == readPropExpr.name) ||
          definedView.getters.some((field) => field.name == readPropExpr.name)) {
        viewProp = viewProp.cast(definedView.classType);
      }
    }
    return o.replaceVarInExpression(o.THIS_EXPR.name, viewProp, property);
  }
}

export function injectFromViewParentInjector(
    token: CompileTokenMetadata, optional: boolean): o.Expression {
  var args = [createDiTokenExpression(token)];
  if (optional) {
    args.push(o.NULL_EXPR);
  }
  return o.THIS_EXPR.prop('parentInjector').callMethod('get', args);
}

export function getViewFactoryName(
    component: CompileDirectiveMetadata, embeddedTemplateIndex: number): string {
  return `viewFactory_${component.type.name}${embeddedTemplateIndex}`;
}

export function createFlatArray(expressions: o.Expression[]): o.Expression {
  var lastNonArrayExpressions: any[] /** TODO #9100 */ = [];
  var result: o.Expression = o.literalArr([]);
  for (var i = 0; i < expressions.length; i++) {
    var expr = expressions[i];
    if (expr.type instanceof o.ArrayType) {
      if (lastNonArrayExpressions.length > 0) {
        result =
            result.callMethod(o.BuiltinMethod.ConcatArray, [o.literalArr(lastNonArrayExpressions)]);
        lastNonArrayExpressions = [];
      }
      result = result.callMethod(o.BuiltinMethod.ConcatArray, [expr]);
    } else {
      lastNonArrayExpressions.push(expr);
    }
  }
  if (lastNonArrayExpressions.length > 0) {
    result =
        result.callMethod(o.BuiltinMethod.ConcatArray, [o.literalArr(lastNonArrayExpressions)]);
  }
  return result;
}

export function createPureProxy(
    fn: o.Expression, argCount: number, pureProxyProp: o.ReadPropExpr, view: CompileView) {
  view.fields.push(new o.ClassField(pureProxyProp.name, null));
  var pureProxyId =
      argCount < Identifiers.pureProxies.length ? Identifiers.pureProxies[argCount] : null;
  if (isBlank(pureProxyId)) {
    throw new Error(`Unsupported number of argument for pure functions: ${argCount}`);
  }
  view.createMethod.addStmt(o.THIS_EXPR.prop(pureProxyProp.name)
                                .set(o.importExpr(resolveIdentifier(pureProxyId)).callFn([fn]))
                                .toStmt());
}
