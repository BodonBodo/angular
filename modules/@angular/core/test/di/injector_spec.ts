/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


import {Injector} from '@angular/core';
import {beforeEach, ddescribe, describe, expect, iit, it} from '@angular/core/testing/testing_internal';

import {IS_DART} from '../../src/facade/lang';

export function main() {
  describe('Injector.NULL', () => {
    it('should throw if no arg is given', () => {
      expect(() => Injector.NULL.get('someToken')).toThrowError('No provider for someToken!');
    });

    it('should throw if THROW_IF_NOT_FOUND is given', () => {
      expect(() => Injector.NULL.get('someToken', Injector.THROW_IF_NOT_FOUND))
          .toThrowError('No provider for someToken!');
    });

    it('should return the default value',
       () => { expect(Injector.NULL.get('someToken', 'notFound')).toEqual('notFound'); });
  });
}
