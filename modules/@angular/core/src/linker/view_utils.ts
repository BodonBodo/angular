/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {APP_ID} from '../application_tokens';
import {SimpleChange, devModeEqual} from '../change_detection/change_detection';
import {UNINITIALIZED} from '../change_detection/change_detection_util';
import {Inject, Injectable} from '../di';
import {isPresent, looseIdentical} from '../facade/lang';
import {ViewEncapsulation} from '../metadata/view';
import {RenderComponentType, RenderDebugInfo, Renderer, RootRenderer} from '../render/api';
import {Sanitizer} from '../security';

import {AppElement} from './element';
import {ExpressionChangedAfterItHasBeenCheckedError} from './errors';

@Injectable()
export class ViewUtils {
  sanitizer: Sanitizer;
  private _nextCompTypeId: number = 0;

  constructor(
      private _renderer: RootRenderer, @Inject(APP_ID) private _appId: string,
      sanitizer: Sanitizer) {
    this.sanitizer = sanitizer;
  }

  /**
   * Used by the generated code
   */
  // TODO (matsko): add typing for the animation function
  createRenderComponentType(
      templateUrl: string, slotCount: number, encapsulation: ViewEncapsulation,
      styles: Array<string|any[]>, animations: {[key: string]: Function}): RenderComponentType {
    return new RenderComponentType(
        `${this._appId}-${this._nextCompTypeId++}`, templateUrl, slotCount, encapsulation, styles,
        animations);
  }

  /** @internal */
  renderComponent(renderComponentType: RenderComponentType): Renderer {
    return this._renderer.renderComponent(renderComponentType);
  }
}

export function flattenNestedViewRenderNodes(nodes: any[]): any[] {
  return _flattenNestedViewRenderNodes(nodes, []);
}

function _flattenNestedViewRenderNodes(nodes: any[], renderNodes: any[]): any[] {
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node instanceof AppElement) {
      var appEl = <AppElement>node;
      renderNodes.push(appEl.nativeElement);
      if (isPresent(appEl.nestedViews)) {
        for (var k = 0; k < appEl.nestedViews.length; k++) {
          _flattenNestedViewRenderNodes(appEl.nestedViews[k].rootNodesOrAppElements, renderNodes);
        }
      }
    } else {
      renderNodes.push(node);
    }
  }
  return renderNodes;
}

const EMPTY_ARR: any[] = [];

export function ensureSlotCount(projectableNodes: any[][], expectedSlotCount: number): any[][] {
  var res: any[][];
  if (!projectableNodes) {
    res = EMPTY_ARR;
  } else if (projectableNodes.length < expectedSlotCount) {
    var givenSlotCount = projectableNodes.length;
    res = new Array(expectedSlotCount);
    for (var i = 0; i < expectedSlotCount; i++) {
      res[i] = (i < givenSlotCount) ? projectableNodes[i] : EMPTY_ARR;
    }
  } else {
    res = projectableNodes;
  }
  return res;
}

export const MAX_INTERPOLATION_VALUES = 9;

export function interpolate(
    valueCount: number, c0: string, a1: any, c1: string, a2?: any, c2?: string, a3?: any,
    c3?: string, a4?: any, c4?: string, a5?: any, c5?: string, a6?: any, c6?: string, a7?: any,
    c7?: string, a8?: any, c8?: string, a9?: any, c9?: string): string {
  switch (valueCount) {
    case 1:
      return c0 + _toStringWithNull(a1) + c1;
    case 2:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2;
    case 3:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3;
    case 4:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4;
    case 5:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5;
    case 6:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) + c6;
    case 7:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
          c6 + _toStringWithNull(a7) + c7;
    case 8:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
          c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8;
    case 9:
      return c0 + _toStringWithNull(a1) + c1 + _toStringWithNull(a2) + c2 + _toStringWithNull(a3) +
          c3 + _toStringWithNull(a4) + c4 + _toStringWithNull(a5) + c5 + _toStringWithNull(a6) +
          c6 + _toStringWithNull(a7) + c7 + _toStringWithNull(a8) + c8 + _toStringWithNull(a9) + c9;
    default:
      throw new Error(`Does not support more than 9 expressions`);
  }
}

function _toStringWithNull(v: any): string {
  return v != null ? v.toString() : '';
}

export function checkBinding(throwOnChange: boolean, oldValue: any, newValue: any): boolean {
  if (throwOnChange) {
    if (!devModeEqual(oldValue, newValue)) {
      throw new ExpressionChangedAfterItHasBeenCheckedError(oldValue, newValue);
    }
    return false;
  } else {
    return !looseIdentical(oldValue, newValue);
  }
}

export function castByValue<T>(input: any, value: T): T {
  return <T>input;
}

export const EMPTY_ARRAY: any[] = [];
export const EMPTY_MAP = {};

export function pureProxy1<P0, R>(fn: (p0: P0) => R): (p0: P0) => R {
  let result: R;
  let v0: any = UNINITIALIZED;

  return (p0) => {
    if (!looseIdentical(v0, p0)) {
      v0 = p0;
      result = fn(p0);
    }
    return result;
  };
}

export function pureProxy2<P0, P1, R>(fn: (p0: P0, p1: P1) => R): (p0: P0, p1: P1) => R {
  let result: R;
  let v0: any = UNINITIALIZED;
  let v1: any = UNINITIALIZED;

  return (p0, p1) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1)) {
      v0 = p0;
      v1 = p1;
      result = fn(p0, p1);
    }
    return result;
  };
}

export function pureProxy3<P0, P1, P2, R>(fn: (p0: P0, p1: P1, p2: P2) => R): (
    p0: P0, p1: P1, p2: P2) => R {
  let result: R;
  let v0: any = UNINITIALIZED;
  let v1: any = UNINITIALIZED;
  let v2: any = UNINITIALIZED;

  return (p0, p1, p2) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      result = fn(p0, p1, p2);
    }
    return result;
  };
}

export function pureProxy4<P0, P1, P2, P3, R>(fn: (p0: P0, p1: P1, p2: P2, p3: P3) => R): (
    p0: P0, p1: P1, p2: P2, p3: P3) => R {
  let result: R;
  let v0: any, v1: any, v2: any, v3: any;
  v0 = v1 = v2 = v3 = UNINITIALIZED;
  return (p0, p1, p2, p3) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      result = fn(p0, p1, p2, p3);
    }
    return result;
  };
}

export function pureProxy5<P0, P1, P2, P3, P4, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) => R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4) =>
    R {
  let result: R;
  let v0: any, v1: any, v2: any, v3: any, v4: any;
  v0 = v1 = v2 = v3 = v4 = UNINITIALIZED;
  return (p0, p1, p2, p3, p4) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      result = fn(p0, p1, p2, p3, p4);
    }
    return result;
  };
}


export function pureProxy6<P0, P1, P2, P3, P4, P5, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => R {
  let result: R;
  let v0: any, v1: any, v2: any, v3: any, v4: any, v5: any;
  v0 = v1 = v2 = v3 = v4 = v5 = UNINITIALIZED;
  return (p0, p1, p2, p3, p4, p5) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      result = fn(p0, p1, p2, p3, p4, p5);
    }
    return result;
  };
}

export function pureProxy7<P0, P1, P2, P3, P4, P5, P6, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) => R {
  let result: R;
  let v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any;
  v0 = v1 = v2 = v3 = v4 = v5 = v6 = UNINITIALIZED;
  return (p0, p1, p2, p3, p4, p5, p6) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5) ||
        !looseIdentical(v6, p6)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      v6 = p6;
      result = fn(p0, p1, p2, p3, p4, p5, p6);
    }
    return result;
  };
}

export function pureProxy8<P0, P1, P2, P3, P4, P5, P6, P7, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7) => R {
  let result: R;
  let v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any;
  v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = UNINITIALIZED;
  return (p0, p1, p2, p3, p4, p5, p6, p7) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5) ||
        !looseIdentical(v6, p6) || !looseIdentical(v7, p7)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      v6 = p6;
      v7 = p7;
      result = fn(p0, p1, p2, p3, p4, p5, p6, p7);
    }
    return result;
  };
}

export function pureProxy9<P0, P1, P2, P3, P4, P5, P6, P7, P8, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8) => R {
  let result: R;
  let v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any;
  v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = v8 = UNINITIALIZED;
  return (p0, p1, p2, p3, p4, p5, p6, p7, p8) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5) ||
        !looseIdentical(v6, p6) || !looseIdentical(v7, p7) || !looseIdentical(v8, p8)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      v6 = p6;
      v7 = p7;
      v8 = p8;
      result = fn(p0, p1, p2, p3, p4, p5, p6, p7, p8);
    }
    return result;
  };
}

export function pureProxy10<P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, R>(
    fn: (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8, p9: P9) =>
        R): (p0: P0, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6, p7: P7, p8: P8, p9: P9) => R {
  let result: R;
  let v0: any, v1: any, v2: any, v3: any, v4: any, v5: any, v6: any, v7: any, v8: any, v9: any;
  v0 = v1 = v2 = v3 = v4 = v5 = v6 = v7 = v8 = v9 = UNINITIALIZED;
  return (p0, p1, p2, p3, p4, p5, p6, p7, p8, p9) => {
    if (!looseIdentical(v0, p0) || !looseIdentical(v1, p1) || !looseIdentical(v2, p2) ||
        !looseIdentical(v3, p3) || !looseIdentical(v4, p4) || !looseIdentical(v5, p5) ||
        !looseIdentical(v6, p6) || !looseIdentical(v7, p7) || !looseIdentical(v8, p8) ||
        !looseIdentical(v9, p9)) {
      v0 = p0;
      v1 = p1;
      v2 = p2;
      v3 = p3;
      v4 = p4;
      v5 = p5;
      v6 = p6;
      v7 = p7;
      v8 = p8;
      v9 = p9;
      result = fn(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9);
    }
    return result;
  };
}

export function setBindingDebugInfoForChanges(
    renderer: Renderer, el: any, changes: {[key: string]: SimpleChange}) {
  Object.keys(changes).forEach((propName) => {
    setBindingDebugInfo(renderer, el, propName, changes[propName].currentValue);
  });
}

export function setBindingDebugInfo(renderer: Renderer, el: any, propName: string, value: any) {
  try {
    renderer.setBindingDebugInfo(
        el, `ng-reflect-${camelCaseToDashCase(propName)}`, value ? value.toString() : null);
  } catch (e) {
    renderer.setBindingDebugInfo(
        el, `ng-reflect-${camelCaseToDashCase(propName)}`,
        '[ERROR] Exception while trying to serialize the value');
  }
}

const CAMEL_CASE_REGEXP = /([A-Z])/g;

function camelCaseToDashCase(input: string): string {
  return input.replace(CAMEL_CASE_REGEXP, (...m: any[]) => '-' + m[1].toLowerCase());
}

export function createRenderElement(
    renderer: Renderer, parentElement: any, name: string, attrs: InlineArray<string>,
    debugInfo?: RenderDebugInfo): any {
  const el = renderer.createElement(parentElement, name, debugInfo);
  for (var i = 0; i < attrs.length; i += 2) {
    renderer.setElementAttribute(el, attrs.get(i), attrs.get(i + 1));
  }
  return el;
}

export function selectOrCreateRenderHostElement(
    renderer: Renderer, elementName: string, attrs: InlineArray<string>,
    rootSelectorOrNode: string | any, debugInfo?: RenderDebugInfo): any {
  var hostElement: any;
  if (isPresent(rootSelectorOrNode)) {
    hostElement = renderer.selectRootElement(rootSelectorOrNode, debugInfo);
  } else {
    hostElement = createRenderElement(renderer, null, elementName, attrs, debugInfo);
  }
  return hostElement;
}

export interface InlineArray<T> {
  length: number;
  get(index: number): T;
}

class InlineArray0 implements InlineArray<any> {
  length = 0;
  get(index: number): any { return undefined; }
}

export class InlineArray2<T> implements InlineArray<T> {
  constructor(public length: number, private _v0: T, private _v1: T) {}
  get(index: number) {
    switch (index) {
      case 0:
        return this._v0;
      case 1:
        return this._v1;
      default:
        return undefined;
    }
  }
}

export class InlineArray4<T> implements InlineArray<T> {
  constructor(
      public length: number, private _v0: T, private _v1: T, private _v2: T, private _v3: T) {}
  get(index: number) {
    switch (index) {
      case 0:
        return this._v0;
      case 1:
        return this._v1;
      case 2:
        return this._v2;
      case 3:
        return this._v3;
      default:
        return undefined;
    }
  }
}

export class InlineArray8<T> implements InlineArray<T> {
  constructor(
      public length: number, private _v0: T, private _v1: T, private _v2: T, private _v3: T,
      private _v4: T, private _v5: T, private _v6: T, private _v7: T) {}
  get(index: number) {
    switch (index) {
      case 0:
        return this._v0;
      case 1:
        return this._v1;
      case 2:
        return this._v2;
      case 3:
        return this._v3;
      case 4:
        return this._v4;
      case 5:
        return this._v5;
      case 6:
        return this._v6;
      case 7:
        return this._v7;
      default:
        return undefined;
    }
  }
}

export class InlineArray16<T> implements InlineArray<T> {
  constructor(
      public length: number, private _v0: T, private _v1: T, private _v2: T, private _v3: T,
      private _v4: T, private _v5: T, private _v6: T, private _v7: T, private _v8: T,
      private _v9: T, private _v10: T, private _v11: T, private _v12: T, private _v13: T,
      private _v14: T, private _v15: T) {}
  get(index: number) {
    switch (index) {
      case 0:
        return this._v0;
      case 1:
        return this._v1;
      case 2:
        return this._v2;
      case 3:
        return this._v3;
      case 4:
        return this._v4;
      case 5:
        return this._v5;
      case 6:
        return this._v6;
      case 7:
        return this._v7;
      case 8:
        return this._v8;
      case 9:
        return this._v9;
      case 10:
        return this._v10;
      case 11:
        return this._v11;
      case 12:
        return this._v12;
      case 13:
        return this._v13;
      case 14:
        return this._v14;
      case 15:
        return this._v15;
      default:
        return undefined;
    }
  }
}

export class InlineArrayDynamic<T> implements InlineArray<T> {
  private _values: any[];
  // Note: We still take the length argument so this class can be created
  // in the same ways as the other classes!
  constructor(public length: number, ...values: any[]) { this._values = values; }

  get(index: number) { return this._values[index]; }
}

export const EMPTY_INLINE_ARRAY: InlineArray<any> = new InlineArray0();
