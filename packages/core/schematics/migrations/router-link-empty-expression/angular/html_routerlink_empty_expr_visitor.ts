/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ASTWithSource, EmptyExpr, TmplAstBoundAttribute, TmplAstElement, TmplAstTemplate} from '@angular/compiler';
import {NullVisitor, visitAll} from '@angular/compiler/src/render3/r3_ast';

/**
 * HTML AST visitor that traverses the Render3 HTML AST in order to find all
 * undefined routerLink asssignment ([routerLink]="").
 */
export class RouterLinkEmptyExprVisitor extends NullVisitor {
  readonly emptyRouterLinkExpressions: TmplAstBoundAttribute[] = [];

  override visitElement(element: TmplAstElement): void {
    visitAll(this, element.inputs);
    visitAll(this, element.children);
  }

  override visitTemplate(t: TmplAstTemplate): void {
    visitAll(this, t.inputs);
    visitAll(this, t.children);
  }

  override visitBoundAttribute(node: TmplAstBoundAttribute) {
    if (node.name === 'routerLink' && node.value instanceof ASTWithSource &&
        node.value.ast instanceof EmptyExpr) {
      this.emptyRouterLinkExpressions.push(node);
    }
  }
}
