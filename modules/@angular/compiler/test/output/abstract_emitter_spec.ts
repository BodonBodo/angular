/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {escapeIdentifier} from '@angular/compiler/src/output/abstract_emitter';
import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';

export function main() {
  describe('AbstractEmitter', () => {
    describe('escapeIdentifier', () => {
      it('should escape single quotes',
         () => { expect(escapeIdentifier(`'`, false)).toEqual(`'\\''`); });

      it('should escape backslash',
         () => { expect(escapeIdentifier('\\', false)).toEqual(`'\\\\'`); });

      it('should escape newlines',
         () => { expect(escapeIdentifier('\n', false)).toEqual(`'\\n'`); });

      it('should escape carriage returns',
         () => { expect(escapeIdentifier('\r', false)).toEqual(`'\\r'`); });

      it('should escape $', () => { expect(escapeIdentifier('$', true)).toEqual(`'\\$'`); });
      it('should not escape $', () => { expect(escapeIdentifier('$', false)).toEqual(`'$'`); });
      it('should add quotes for non-identifiers',
         () => { expect(escapeIdentifier('==', false, false)).toEqual(`'=='`); });
      it('does not escape class (but it probably should)',
         () => { expect(escapeIdentifier('class', false, false)).toEqual('class'); });
    });

  });
}
