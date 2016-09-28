/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DefaultIterableDiffer, DefaultIterableDifferFactory} from '@angular/core/src/change_detection/differs/default_iterable_differ';
import {beforeEach, describe, expect, it} from '@angular/core/testing/testing_internal';

import {ListWrapper} from '../../../src/facade/collection';
import {NumberWrapper} from '../../../src/facade/lang';
import {TestIterable} from '../../change_detection/iterable';
import {iterableChangesAsString} from '../../change_detection/util';

class ItemWithId {
  constructor(private id: string) {}

  toString() { return `{id: ${this.id}}`; }
}

class ComplexItem {
  constructor(private id: string, private color: string) {}

  toString() { return `{id: ${this.id}, color: ${this.color}}`; }
}

// todo(vicb): UnmodifiableListView / frozen object when implemented
export function main() {
  describe('iterable differ', function() {
    describe('DefaultIterableDiffer', function() {
      var differ: any /** TODO #9100 */;

      beforeEach(() => { differ = new DefaultIterableDiffer(); });

      it('should support list and iterables', () => {
        var f = new DefaultIterableDifferFactory();
        expect(f.supports([])).toBeTruthy();
        expect(f.supports(new TestIterable())).toBeTruthy();
        expect(f.supports(new Map())).toBeFalsy();
        expect(f.supports(null)).toBeFalsy();
      });

      it('should support iterables', () => {
        let l = new TestIterable();

        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({collection: []}));

        l.list = [1];
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['1[null->0]'],
          additions: ['1[null->0]']
        }));

        l.list = [2, 1];
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['2[null->0]', '1[0->1]'],
          previous: ['1[0->1]'],
          additions: ['2[null->0]'],
          moves: ['1[0->1]']
        }));
      });

      it('should detect additions', () => {
        let l: any[] /** TODO #9100 */ = [];
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({collection: []}));

        l.push('a');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['a[null->0]'],
          additions: ['a[null->0]']
        }));

        l.push('b');
        differ.check(l);
        expect(differ.toString())
            .toEqual(iterableChangesAsString(
                {collection: ['a', 'b[null->1]'], previous: ['a'], additions: ['b[null->1]']}));
      });

      it('should support changing the reference', () => {
        let l = [0];
        differ.check(l);

        l = [1, 0];
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['1[null->0]', '0[0->1]'],
          previous: ['0[0->1]'],
          additions: ['1[null->0]'],
          moves: ['0[0->1]']
        }));

        l = [2, 1, 0];
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['2[null->0]', '1[0->1]', '0[1->2]'],
          previous: ['1[0->1]', '0[1->2]'],
          additions: ['2[null->0]'],
          moves: ['1[0->1]', '0[1->2]']
        }));
      });

      it('should handle swapping element', () => {
        let l = [1, 2];
        differ.check(l);

        ListWrapper.clear(l);
        l.push(2);
        l.push(1);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['2[1->0]', '1[0->1]'],
          previous: ['1[0->1]', '2[1->0]'],
          moves: ['2[1->0]', '1[0->1]']
        }));
      });

      it('should handle incremental swapping element', () => {
        let l = ['a', 'b', 'c'];
        differ.check(l);

        ListWrapper.removeAt(l, 1);
        ListWrapper.insert(l, 0, 'b');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['b[1->0]', 'a[0->1]', 'c'],
          previous: ['a[0->1]', 'b[1->0]', 'c'],
          moves: ['b[1->0]', 'a[0->1]']
        }));

        ListWrapper.removeAt(l, 1);
        l.push('a');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['b', 'c[2->1]', 'a[1->2]'],
          previous: ['b', 'a[1->2]', 'c[2->1]'],
          moves: ['c[2->1]', 'a[1->2]']
        }));
      });

      it('should detect changes in list', () => {
        let l: any[] /** TODO #9100 */ = [];
        differ.check(l);

        l.push('a');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['a[null->0]'],
          additions: ['a[null->0]']
        }));

        l.push('b');
        differ.check(l);
        expect(differ.toString())
            .toEqual(iterableChangesAsString(
                {collection: ['a', 'b[null->1]'], previous: ['a'], additions: ['b[null->1]']}));

        l.push('c');
        l.push('d');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['a', 'b', 'c[null->2]', 'd[null->3]'],
          previous: ['a', 'b'],
          additions: ['c[null->2]', 'd[null->3]']
        }));

        ListWrapper.removeAt(l, 2);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['a', 'b', 'd[3->2]'],
          previous: ['a', 'b', 'c[2->null]', 'd[3->2]'],
          moves: ['d[3->2]'],
          removals: ['c[2->null]']
        }));

        ListWrapper.clear(l);
        l.push('d');
        l.push('c');
        l.push('b');
        l.push('a');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['d[2->0]', 'c[null->1]', 'b[1->2]', 'a[0->3]'],
          previous: ['a[0->3]', 'b[1->2]', 'd[2->0]'],
          additions: ['c[null->1]'],
          moves: ['d[2->0]', 'b[1->2]', 'a[0->3]']
        }));
      });

      it('should test string by value rather than by reference (Dart)', () => {
        let l = ['a', 'boo'];
        differ.check(l);

        var b = 'b';
        var oo = 'oo';
        l[1] = b + oo;
        differ.check(l);
        expect(differ.toString())
            .toEqual(iterableChangesAsString({collection: ['a', 'boo'], previous: ['a', 'boo']}));
      });

      it('should ignore [NaN] != [NaN] (JS)', () => {
        let l = [NumberWrapper.NaN];
        differ.check(l);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: [NumberWrapper.NaN],
          previous: [NumberWrapper.NaN]
        }));
      });

      it('should detect [NaN] moves', () => {
        let l = [NumberWrapper.NaN, NumberWrapper.NaN];
        differ.check(l);

        ListWrapper.insert<any>(l, 0, 'foo');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['foo[null->0]', 'NaN[0->1]', 'NaN[1->2]'],
          previous: ['NaN[0->1]', 'NaN[1->2]'],
          additions: ['foo[null->0]'],
          moves: ['NaN[0->1]', 'NaN[1->2]']
        }));
      });

      it('should remove and add same item', () => {
        let l = ['a', 'b', 'c'];
        differ.check(l);

        ListWrapper.removeAt(l, 1);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['a', 'c[2->1]'],
          previous: ['a', 'b[1->null]', 'c[2->1]'],
          moves: ['c[2->1]'],
          removals: ['b[1->null]']
        }));

        ListWrapper.insert(l, 1, 'b');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['a', 'b[null->1]', 'c[1->2]'],
          previous: ['a', 'c[1->2]'],
          additions: ['b[null->1]'],
          moves: ['c[1->2]']
        }));
      });


      it('should support duplicates', () => {
        let l = ['a', 'a', 'a', 'b', 'b'];
        differ.check(l);

        ListWrapper.removeAt(l, 0);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['a', 'a', 'b[3->2]', 'b[4->3]'],
          previous: ['a', 'a', 'a[2->null]', 'b[3->2]', 'b[4->3]'],
          moves: ['b[3->2]', 'b[4->3]'],
          removals: ['a[2->null]']
        }));
      });

      it('should support insertions/moves', () => {
        let l = ['a', 'a', 'b', 'b'];
        differ.check(l);

        ListWrapper.insert(l, 0, 'b');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['b[2->0]', 'a[0->1]', 'a[1->2]', 'b', 'b[null->4]'],
          previous: ['a[0->1]', 'a[1->2]', 'b[2->0]', 'b'],
          additions: ['b[null->4]'],
          moves: ['b[2->0]', 'a[0->1]', 'a[1->2]']
        }));
      });

      it('should not report unnecessary moves', () => {
        let l = ['a', 'b', 'c'];
        differ.check(l);

        ListWrapper.clear(l);
        l.push('b');
        l.push('a');
        l.push('c');
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['b[1->0]', 'a[0->1]', 'c'],
          previous: ['a[0->1]', 'b[1->0]', 'c'],
          moves: ['b[1->0]', 'a[0->1]']
        }));
      });

      describe('forEachOperation', () => {
        function stringifyItemChange(record: any, p: number, c: number, originalIndex: number) {
          var suffix = originalIndex == null ? '' : ' [o=' + originalIndex + ']';
          var value = record.item;
          if (record.currentIndex == null) {
            return `REMOVE ${value} (${p} -> VOID)${suffix}`;
          } else if (record.previousIndex == null) {
            return `INSERT ${value} (VOID -> ${c})${suffix}`;
          } else {
            return `MOVE ${value} (${p} -> ${c})${suffix}`;
          }
        }

        function modifyArrayUsingOperation(
            arr: number[], endData: any[], prev: number, next: number) {
          var value: number = null;
          if (prev == null) {
            value = endData[next];
            arr.splice(next, 0, value);
          } else if (next == null) {
            value = arr[prev];
            arr.splice(prev, 1);
          } else {
            value = arr[prev];
            arr.splice(prev, 1);
            arr.splice(next, 0, value);
          }
          return value;
        }

        it('should trigger a series of insert/move/remove changes for inputs that have been diffed',
           () => {
             var startData = [0, 1, 2, 3, 4, 5];
             var endData = [6, 2, 7, 0, 4, 8];

             differ = differ.diff(startData);
             differ = differ.diff(endData);

             var operations: string[] = [];
             differ.forEachOperation((item: any, prev: number, next: number) => {
               var value = modifyArrayUsingOperation(startData, endData, prev, next);
               operations.push(stringifyItemChange(item, prev, next, item.previousIndex));
             });

             expect(operations).toEqual([
               'INSERT 6 (VOID -> 0)', 'MOVE 2 (3 -> 1) [o=2]', 'INSERT 7 (VOID -> 2)',
               'REMOVE 1 (4 -> VOID) [o=1]', 'REMOVE 3 (4 -> VOID) [o=3]',
               'REMOVE 5 (5 -> VOID) [o=5]', 'INSERT 8 (VOID -> 5)'
             ]);

             expect(startData).toEqual(endData);
           });

        it('should consider inserting/removing/moving items with respect to items that have not moved at all',
           () => {
             var startData = [0, 1, 2, 3];
             var endData = [2, 1];

             differ = differ.diff(startData);
             differ = differ.diff(endData);

             var operations: string[] = [];
             differ.forEachOperation((item: any, prev: number, next: number) => {
               var value = modifyArrayUsingOperation(startData, endData, prev, next);
               operations.push(stringifyItemChange(item, prev, next, item.previousIndex));
             });

             expect(operations).toEqual([
               'REMOVE 0 (0 -> VOID) [o=0]', 'MOVE 2 (1 -> 0) [o=2]', 'REMOVE 3 (2 -> VOID) [o=3]'
             ]);

             expect(startData).toEqual(endData);
           });

        it('should be able to manage operations within a criss/cross of move operations', () => {
          var startData = [1, 2, 3, 4, 5, 6];
          var endData = [3, 6, 4, 9, 1, 2];

          differ = differ.diff(startData);
          differ = differ.diff(endData);

          var operations: string[] = [];
          differ.forEachOperation((item: any, prev: number, next: number) => {
            var value = modifyArrayUsingOperation(startData, endData, prev, next);
            operations.push(stringifyItemChange(item, prev, next, item.previousIndex));
          });

          expect(operations).toEqual([
            'MOVE 3 (2 -> 0) [o=2]', 'MOVE 6 (5 -> 1) [o=5]', 'MOVE 4 (4 -> 2) [o=3]',
            'INSERT 9 (VOID -> 3)', 'REMOVE 5 (6 -> VOID) [o=4]'
          ]);

          expect(startData).toEqual(endData);
        });

        it('should skip moves for multiple nodes that have not moved', () => {
          var startData = [0, 1, 2, 3, 4];
          var endData = [4, 1, 2, 3, 0, 5];

          differ = differ.diff(startData);
          differ = differ.diff(endData);

          var operations: string[] = [];
          differ.forEachOperation((item: any, prev: number, next: number) => {
            var value = modifyArrayUsingOperation(startData, endData, prev, next);
            operations.push(stringifyItemChange(item, prev, next, item.previousIndex));
          });

          expect(operations).toEqual([
            'MOVE 4 (4 -> 0) [o=4]', 'MOVE 1 (2 -> 1) [o=1]', 'MOVE 2 (3 -> 2) [o=2]',
            'MOVE 3 (4 -> 3) [o=3]', 'INSERT 5 (VOID -> 5)'
          ]);

          expect(startData).toEqual(endData);
        });

        it('should not fail', () => {
          var startData = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
          var endData = [10, 11, 1, 5, 7, 8, 0, 5, 3, 6];

          differ = differ.diff(startData);
          differ = differ.diff(endData);

          var operations: string[] = [];
          differ.forEachOperation((item: any, prev: number, next: number) => {
            var value = modifyArrayUsingOperation(startData, endData, prev, next);
            operations.push(stringifyItemChange(item, prev, next, item.previousIndex));
          });

          expect(operations).toEqual([
            'MOVE 10 (10 -> 0) [o=10]', 'MOVE 11 (11 -> 1) [o=11]', 'MOVE 1 (3 -> 2) [o=1]',
            'MOVE 5 (7 -> 3) [o=5]', 'MOVE 7 (9 -> 4) [o=7]', 'MOVE 8 (10 -> 5) [o=8]',
            'REMOVE 2 (7 -> VOID) [o=2]', 'INSERT 5 (VOID -> 7)', 'REMOVE 4 (9 -> VOID) [o=4]',
            'REMOVE 9 (10 -> VOID) [o=9]'
          ]);

          expect(startData).toEqual(endData);
        });

        it('should trigger nothing when the list is completely full of replaced items that are tracked by the index',
           () => {
             differ = new DefaultIterableDiffer((index: number) => index);

             var startData = [1, 2, 3, 4];
             var endData = [5, 6, 7, 8];

             differ = differ.diff(startData);
             differ = differ.diff(endData);

             var operations: string[] = [];
             differ.forEachOperation((item: any, prev: number, next: number) => {
               var value = modifyArrayUsingOperation(startData, endData, prev, next);
               operations.push(stringifyItemChange(item, prev, next, item.previousIndex));
             });

             expect(operations).toEqual([]);
           });
      });

      describe('diff', () => {
        it('should return self when there is a change', () => {
          expect(differ.diff(['a', 'b'])).toBe(differ);
        });

        it('should return null when there is no change', () => {
          differ.diff(['a', 'b']);
          expect(differ.diff(['a', 'b'])).toEqual(null);
        });

        it('should treat null as an empty list', () => {
          differ.diff(['a', 'b']);
          expect(differ.diff(null).toString()).toEqual(iterableChangesAsString({
            previous: ['a[0->null]', 'b[1->null]'],
            removals: ['a[0->null]', 'b[1->null]']
          }));
        });

        it('should throw when given an invalid collection', () => {
          expect(() => differ.diff('invalid')).toThrowError('Error trying to diff \'invalid\'');
        });
      });
    });

    describe('trackBy function by id', function() {
      var differ: any /** TODO #9100 */;

      var trackByItemId = (index: number, item: any): any => item.id;

      var buildItemList =
          (list: string[]) => { return list.map((val) => { return new ItemWithId(val); }); };

      beforeEach(() => { differ = new DefaultIterableDiffer(trackByItemId); });

      it('should treat the collection as dirty if identity changes', () => {
        differ.diff(buildItemList(['a']));
        expect(differ.diff(buildItemList(['a']))).toBe(differ);
      });

      it('should treat seen records as identity changes, not additions', () => {
        let l = buildItemList(['a', 'b', 'c']);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: [`{id: a}[null->0]`, `{id: b}[null->1]`, `{id: c}[null->2]`],
          additions: [`{id: a}[null->0]`, `{id: b}[null->1]`, `{id: c}[null->2]`]
        }));

        l = buildItemList(['a', 'b', 'c']);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: [`{id: a}`, `{id: b}`, `{id: c}`],
          identityChanges: [`{id: a}`, `{id: b}`, `{id: c}`],
          previous: [`{id: a}`, `{id: b}`, `{id: c}`]
        }));
      });

      it('should have updated properties in identity change collection', () => {
        let l = [new ComplexItem('a', 'blue'), new ComplexItem('b', 'yellow')];
        differ.check(l);

        l = [new ComplexItem('a', 'orange'), new ComplexItem('b', 'red')];
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: [`{id: a, color: orange}`, `{id: b, color: red}`],
          identityChanges: [`{id: a, color: orange}`, `{id: b, color: red}`],
          previous: [`{id: a, color: orange}`, `{id: b, color: red}`]
        }));
      });

      it('should track moves normally', () => {
        let l = buildItemList(['a', 'b', 'c']);
        differ.check(l);

        l = buildItemList(['b', 'a', 'c']);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['{id: b}[1->0]', '{id: a}[0->1]', '{id: c}'],
          identityChanges: ['{id: b}[1->0]', '{id: a}[0->1]', '{id: c}'],
          previous: ['{id: a}[0->1]', '{id: b}[1->0]', '{id: c}'],
          moves: ['{id: b}[1->0]', '{id: a}[0->1]']
        }));

      });

      it('should track duplicate reinsertion normally', () => {
        let l = buildItemList(['a', 'a']);
        differ.check(l);

        l = buildItemList(['b', 'a', 'a']);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['{id: b}[null->0]', '{id: a}[0->1]', '{id: a}[1->2]'],
          identityChanges: ['{id: a}[0->1]', '{id: a}[1->2]'],
          previous: ['{id: a}[0->1]', '{id: a}[1->2]'],
          moves: ['{id: a}[0->1]', '{id: a}[1->2]'],
          additions: ['{id: b}[null->0]']
        }));

      });

      it('should track removals normally', () => {
        let l = buildItemList(['a', 'b', 'c']);
        differ.check(l);

        ListWrapper.removeAt(l, 2);
        differ.check(l);
        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['{id: a}', '{id: b}'],
          previous: ['{id: a}', '{id: b}', '{id: c}[2->null]'],
          removals: ['{id: c}[2->null]']
        }));
      });
    });
    describe('trackBy function by index', function() {
      var differ: any /** TODO #9100 */;

      var trackByIndex = (index: number, item: any): number => index;

      beforeEach(() => { differ = new DefaultIterableDiffer(trackByIndex); });

      it('should track removals normally', () => {
        differ.check(['a', 'b', 'c', 'd']);
        differ.check(['e', 'f', 'g', 'h']);
        differ.check(['e', 'f', 'h']);

        expect(differ.toString()).toEqual(iterableChangesAsString({
          collection: ['e', 'f', 'h'],
          previous: ['e', 'f', 'h', 'h[3->null]'],
          removals: ['h[3->null]'],
          identityChanges: ['h']
        }));
      });

    });


  });
}
