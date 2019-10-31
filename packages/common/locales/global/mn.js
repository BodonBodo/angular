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
    if (n === 1) return 1;
    return 5;
  }
  root.ng.common.locales['mn'] = [
    'mn',
    [['үө', 'үх'], ['ҮӨ', 'ҮХ'], ['ү.ө', 'ү.х']],
    [['ҮӨ', 'ҮХ'], u, u],
    [
      ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя'], u,
      [
        'ням', 'даваа', 'мягмар', 'лхагва', 'пүрэв', 'баасан',
        'бямба'
      ],
      ['Ня', 'Да', 'Мя', 'Лх', 'Пү', 'Ба', 'Бя']
    ],
    u,
    [
      ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'],
      [
        '1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар',
        '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'
      ],
      [
        'Нэгдүгээр сар', 'Хоёрдугаар сар', 'Гуравдугаар сар',
        'Дөрөвдүгээр сар', 'Тавдугаар сар',
        'Зургаадугаар сар', 'Долдугаар сар',
        'Наймдугаар сар', 'Есдүгээр сар', 'Аравдугаар сар',
        'Арван нэгдүгээр сар', 'Арван хоёрдугаар сар'
      ]
    ],
    u,
    [['МЭӨ', 'МЭ'], u, ['манай эриний өмнөх', 'манай эриний']],
    1,
    [6, 0],
    ['y.MM.dd', u, u, 'y.MM.dd, EEEE'],
    ['HH:mm', 'HH:mm:ss', 'HH:mm:ss (z)', 'HH:mm:ss (zzzz)'],
    ['{1} {0}', u, u, u],
    ['.', ',', ';', '%', '+', '-', 'E', '×', '‰', '∞', 'NaN', ':'],
    ['#,##0.###', '#,##0%', '¤ #,##0.00', '#E0'],
    '₮',
    'төгрөг',
    {'JPY': ['JP¥', '¥'], 'MNT': ['₮'], 'SEK': [u, 'кр'], 'THB': ['฿'], 'TWD': ['NT$']},
    plural,
    [
      [
        ['шөнө дунд', 'үд дунд', 'өглөө', 'өдөр', 'орой', 'шөнө'], u,
        u
      ],
      u,
      [
        '00:00', '12:00', ['06:00', '12:00'], ['12:00', '18:00'], ['18:00', '21:00'],
        ['21:00', '06:00']
      ]
    ]
  ];
})(typeof globalThis !== 'undefined' && globalThis || typeof global !== 'undefined' && global ||
   typeof window !== 'undefined' && window);
