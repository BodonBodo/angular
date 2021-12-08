/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {isObservable} from '@angular/core/src/util/lang';
import {of} from 'rxjs';

describe('isObservable', () => {
  it('should be true for an Observable', () => expect(isObservable(of(true))).toEqual(true));

  it('should be true if the argument is the object with subscribe function',
     () => expect(isObservable({subscribe: () => {}})).toEqual(true));

  it('should be false if the argument is undefined',
     () => expect(isObservable(undefined)).toEqual(false));

  it('should be false if the argument is null', () => expect(isObservable(null)).toEqual(false));

  it('should be false if the argument is an object', () => expect(isObservable({})).toEqual(false));

  it('should be false if the argument is a function',
     () => expect(isObservable(() => {})).toEqual(false));
});
