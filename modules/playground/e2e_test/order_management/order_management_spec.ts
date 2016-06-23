/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {verifyNoBrowserErrors} from '@angular/platform-browser/testing_e2e';

describe('Order Management CRUD', function() {
  var URL = 'all/playground/src/order_management/index.html';

  it('should work', function() {
    browser.get(URL);
    verifyNoBrowserErrors();
  });
});
