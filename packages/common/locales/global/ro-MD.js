/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// THIS CODE IS GENERATED - DO NOT MODIFY
// See angular/tools/gulp-tasks/cldr/extract.js

(function(global) {
  global.ng = global.ng || {};
  global.ng.common = global.ng.common || {};
  global.ng.common.locales = global.ng.common.locales || {};
  const u = undefined;
  function plural(n) {
    let i = Math.floor(Math.abs(n)), v = n.toString().replace(/^[^.]*\.?/, '').length;
    if (i === 1 && v === 0) return 1;
    if (!(v === 0) || n === 0 ||
        !(n === 1) && n % 100 === Math.floor(n % 100) && n % 100 >= 1 && n % 100 <= 19)
      return 3;
    return 5;
  }
  global.ng.common.locales['ro-md'] = [
    'ro-MD',
    [['a.m.', 'p.m.'], u, u],
    u,
    [
      ['D', 'L', 'Ma', 'Mi', 'J', 'V', 'S'], ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'],
      ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'],
      ['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ']
    ],
    u,
    [
      ['I', 'F', 'M', 'A', 'M', 'I', 'I', 'A', 'S', 'O', 'N', 'D'],
      [
        'ian.', 'feb.', 'mar.', 'apr.', 'mai', 'iun.', 'iul.', 'aug.', 'sept.', 'oct.', 'nov.',
        'dec.'
      ],
      [
        'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august',
        'septembrie', 'octombrie', 'noiembrie', 'decembrie'
      ]
    ],
    u,
    [['î.Hr.', 'd.Hr.'], u, ['înainte de Hristos', 'după Hristos']],
    1,
    [6, 0],
    ['dd.MM.y', 'd MMM y', 'd MMMM y', 'EEEE, d MMMM y'],
    ['HH:mm', 'HH:mm:ss', 'HH:mm:ss z', 'HH:mm:ss zzzz'],
    ['{1}, {0}', u, u, u],
    [',', '.', ';', '%', '+', '-', 'E', '×', '‰', '∞', 'NaN', ':'],
    ['#,##0.###', '#,##0 %', '#,##0.00 ¤', '#E0'],
    'MDL',
    'L',
    'leu moldovenesc',
    {
      'AUD': [u, '$'],
      'BRL': [u, 'R$'],
      'CAD': [u, '$'],
      'CNY': [u, '¥'],
      'EUR': [u, '€'],
      'GBP': [u, '£'],
      'HKD': [u, '$'],
      'ILS': [u, '₪'],
      'INR': [u, '₹'],
      'JPY': [u, '¥'],
      'KRW': [u, '₩'],
      'MDL': ['L'],
      'MXN': [u, '$'],
      'NZD': [u, '$'],
      'TWD': [u, 'NT$'],
      'USD': [u, '$'],
      'VND': [u, '₫'],
      'XCD': [u, '$']
    },
    'ltr',
    plural,
    [
      [
        ['miezul nopții', 'amiază', 'dimineață', 'după-amiază', 'seară', 'noapte'],
        ['miezul nopții', 'amiază', 'dimineața', 'după-amiaza', 'seara', 'noaptea'], u
      ],
      u,
      [
        '00:00', '12:00', ['05:00', '12:00'], ['12:00', '18:00'], ['18:00', '22:00'],
        ['22:00', '05:00']
      ]
    ]
  ];
})(typeof globalThis !== 'undefined' && globalThis || typeof global !== 'undefined' && global ||
   typeof window !== 'undefined' && window);
