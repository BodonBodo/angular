/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NodeFlags, QueryValueType, ViewData, ViewDefinition, ViewFlags, anchorDef, directiveDef, elementDef, textDef, viewDef} from '@angular/core/src/view/index';
import {filterQueryId} from '@angular/core/src/view/util';

export function main() {
  describe('viewDef', () => {
    describe('reverseChild order', () => {
      function reverseChildOrder(viewDef: ViewDefinition): number[] {
        return viewDef.reverseChildNodes.map(node => node.index);
      }

      it('should reverse child order for root nodes', () => {
        const vd = viewDef(ViewFlags.None, [
          textDef(null, ['a']),  // level 0, index 0
          textDef(null, ['a']),  // level 0, index 0
        ]);

        expect(reverseChildOrder(vd)).toEqual([1, 0]);
      });

      it('should reverse child order for one level, one root', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 2, 'span'),  // level 0, index 0
          textDef(null, ['a']),                               // level 1, index 1
          textDef(null, ['a']),                               // level 1, index 2
        ]);

        expect(reverseChildOrder(vd)).toEqual([0, 2, 1]);
      });

      it('should reverse child order for 1 level, 2 roots', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 2, 'span'),  // level 0, index 0
          textDef(null, ['a']),                               // level 1, index 1
          textDef(null, ['a']),                               // level 1, index 2
          elementDef(NodeFlags.None, null, null, 1, 'span'),  // level 0, index 3
          textDef(null, ['a']),                               // level 1, index 4
        ]);

        expect(reverseChildOrder(vd)).toEqual([3, 4, 0, 2, 1]);
      });

      it('should reverse child order for 2 levels', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 4, 'span'),  // level 0, index 0
          elementDef(NodeFlags.None, null, null, 1, 'span'),  // level 1, index 1
          textDef(null, ['a']),                               // level 2, index 2
          elementDef(NodeFlags.None, null, null, 1, 'span'),  // level 1, index 3
          textDef(null, ['a']),                               // level 2, index 4
        ]);

        expect(reverseChildOrder(vd)).toEqual([0, 3, 4, 1, 2]);
      });

      it('should reverse child order for mixed levels', () => {
        const vd = viewDef(ViewFlags.None, [
          textDef(null, ['a']),                               // level 0, index 0
          elementDef(NodeFlags.None, null, null, 5, 'span'),  // level 0, index 1
          textDef(null, ['a']),                               // level 1, index 2
          elementDef(NodeFlags.None, null, null, 1, 'span'),  // level 1, index 3
          textDef(null, ['a']),                               // level 2, index 4
          elementDef(NodeFlags.None, null, null, 1, 'span'),  // level 1, index 5
          textDef(null, ['a']),                               // level 2, index 6
          textDef(null, ['a']),                               // level 0, index 7
        ]);

        expect(reverseChildOrder(vd)).toEqual([7, 1, 5, 6, 3, 4, 2, 0]);
      });
    });

    describe('parent', () => {
      function parents(viewDef: ViewDefinition): number[] {
        return viewDef.nodes.map(node => node.parent ? node.parent.index : null);
      }

      it('should calculate parents for one level', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          textDef(null, ['a']),
          textDef(null, ['a']),
        ]);

        expect(parents(vd)).toEqual([null, 0, 0]);
      });

      it('should calculate parents for one level, multiple roots', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          textDef(null, ['a']),
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          textDef(null, ['a']),
          textDef(null, ['a']),
        ]);

        expect(parents(vd)).toEqual([null, 0, null, 2, null]);
      });

      it('should calculate parents for multiple levels', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          textDef(null, ['a']),
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          textDef(null, ['a']),
          textDef(null, ['a']),
        ]);

        expect(parents(vd)).toEqual([null, 0, 1, null, 3, null]);
      });
    });

    describe('childFlags', () => {

      function childFlags(viewDef: ViewDefinition): number[] {
        return viewDef.nodes.map(node => node.childFlags);
      }

      it('should calculate childFlags for one level', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          directiveDef(NodeFlags.AfterContentChecked, null, 0, AService, [])
        ]);

        expect(childFlags(vd)).toEqual([
          NodeFlags.TypeDirective | NodeFlags.AfterContentChecked, NodeFlags.None
        ]);
      });

      it('should calculate childFlags for two levels', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          directiveDef(NodeFlags.AfterContentChecked, null, 0, AService, [])
        ]);

        expect(childFlags(vd)).toEqual([
          NodeFlags.TypeElement | NodeFlags.TypeDirective | NodeFlags.AfterContentChecked,
          NodeFlags.TypeDirective | NodeFlags.AfterContentChecked, NodeFlags.None
        ]);
      });

      it('should calculate childFlags for one level, multiple roots', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          directiveDef(NodeFlags.AfterContentChecked, null, 0, AService, []),
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          directiveDef(NodeFlags.AfterContentInit, null, 0, AService, []),
          directiveDef(NodeFlags.AfterViewChecked, null, 0, AService, []),
        ]);

        expect(childFlags(vd)).toEqual([
          NodeFlags.TypeDirective | NodeFlags.AfterContentChecked, NodeFlags.None,
          NodeFlags.TypeDirective | NodeFlags.AfterContentInit | NodeFlags.AfterViewChecked,
          NodeFlags.None, NodeFlags.None
        ]);
      });

      it('should calculate childFlags for multiple levels', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          directiveDef(NodeFlags.AfterContentChecked, null, 0, AService, []),
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          directiveDef(NodeFlags.AfterContentInit, null, 0, AService, []),
          directiveDef(NodeFlags.AfterViewInit, null, 0, AService, []),
        ]);

        expect(childFlags(vd)).toEqual([
          NodeFlags.TypeElement | NodeFlags.TypeDirective | NodeFlags.AfterContentChecked,
          NodeFlags.TypeDirective | NodeFlags.AfterContentChecked, NodeFlags.None,
          NodeFlags.TypeDirective | NodeFlags.AfterContentInit | NodeFlags.AfterViewInit,
          NodeFlags.None, NodeFlags.None
        ]);
      });
    });

    describe('childMatchedQueries', () => {
      function childMatchedQueries(viewDef: ViewDefinition): number[] {
        return viewDef.nodes.map(node => node.childMatchedQueries);
      }

      it('should calculate childMatchedQueries for one level', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          directiveDef(NodeFlags.None, [[1, QueryValueType.Provider]], 0, AService, [])
        ]);

        expect(childMatchedQueries(vd)).toEqual([filterQueryId(1), 0]);
      });

      it('should calculate childMatchedQueries for two levels', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          directiveDef(NodeFlags.None, [[1, QueryValueType.Provider]], 0, AService, [])
        ]);

        expect(childMatchedQueries(vd)).toEqual([filterQueryId(1), filterQueryId(1), 0]);
      });

      it('should calculate childMatchedQueries for one level, multiple roots', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          directiveDef(NodeFlags.None, [[1, QueryValueType.Provider]], 0, AService, []),
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          directiveDef(NodeFlags.None, [[2, QueryValueType.Provider]], 0, AService, []),
          directiveDef(NodeFlags.None, [[3, QueryValueType.Provider]], 0, AService, []),
        ]);

        expect(childMatchedQueries(vd)).toEqual([
          filterQueryId(1), 0, filterQueryId(2) | filterQueryId(3), 0, 0
        ]);
      });

      it('should calculate childMatchedQueries for multiple levels', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          directiveDef(NodeFlags.None, [[1, QueryValueType.Provider]], 0, AService, []),
          elementDef(NodeFlags.None, null, null, 2, 'span'),
          directiveDef(NodeFlags.None, [[2, QueryValueType.Provider]], 0, AService, []),
          directiveDef(NodeFlags.None, [[3, QueryValueType.Provider]], 0, AService, []),
        ]);

        expect(childMatchedQueries(vd)).toEqual([
          filterQueryId(1), filterQueryId(1), 0, filterQueryId(2) | filterQueryId(3), 0, 0
        ]);
      });

      it('should included embedded views into childMatchedQueries', () => {
        const vd = viewDef(ViewFlags.None, [
          elementDef(NodeFlags.None, null, null, 1, 'span'),
          anchorDef(
              NodeFlags.None, null, null, 0, null,
              () => viewDef(
                  ViewFlags.None,
                  [
                    elementDef(NodeFlags.None, [[1, QueryValueType.Provider]], null, 0, 'span'),
                  ]))
        ]);

        // Note: the template will become a sibling to the anchor once stamped out,
        expect(childMatchedQueries(vd)).toEqual([filterQueryId(1), 0]);
      });
    });
  });
}

class AService {}
