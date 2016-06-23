/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

declare class Bitmap {
  constructor(width: number, height: number);

  subsample(n: number): void;
  dataURL(): string;

  pixel:[any];
}
