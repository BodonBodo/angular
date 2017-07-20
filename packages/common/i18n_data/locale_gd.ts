/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// THIS CODE IS GENERATED - DO NOT MODIFY
// See angular/tools/gulp-tasks/cldr/extract.js

import {Plural} from '@angular/common';

export default [
  'gd',
  [
    ['m', 'f'],
    ,
  ],
  ,
  [
    ['D', 'L', 'M', 'C', 'A', 'H', 'S'], ['DiD', 'DiL', 'DiM', 'DiC', 'Dia', 'Dih', 'DiS'],
    ['DiDòmhnaich', 'DiLuain', 'DiMàirt', 'DiCiadain', 'DiarDaoin', 'DihAoine', 'DiSathairne'],
    ['Dò', 'Lu', 'Mà', 'Ci', 'Da', 'hA', 'Sa']
  ],
  ,
  [
    ['F', 'G', 'M', 'G', 'C', 'Ò', 'I', 'L', 'S', 'D', 'S', 'D'],
    [
      'Faoi', 'Gearr', 'Màrt', 'Gibl', 'Cèit', 'Ògmh', 'Iuch', 'Lùna', 'Sult', 'Dàmh', 'Samh',
      'Dùbh'
    ],
    [
      'dhen Fhaoilleach', 'dhen Ghearran', 'dhen Mhàrt', 'dhen Ghiblean', 'dhen Chèitean',
      'dhen Ògmhios', 'dhen Iuchar', 'dhen Lùnastal', 'dhen t-Sultain', 'dhen Dàmhair',
      'dhen t-Samhain', 'dhen Dùbhlachd'
    ]
  ],
  [
    ['F', 'G', 'M', 'G', 'C', 'Ò', 'I', 'L', 'S', 'D', 'S', 'D'],
    [
      'Faoi', 'Gearr', 'Màrt', 'Gibl', 'Cèit', 'Ògmh', 'Iuch', 'Lùna', 'Sult', 'Dàmh', 'Samh',
      'Dùbh'
    ],
    [
      'Am Faoilleach', 'An Gearran', 'Am Màrt', 'An Giblean', 'An Cèitean', 'An t-Ògmhios',
      'An t-Iuchar', 'An Lùnastal', 'An t-Sultain', 'An Dàmhair', 'An t-Samhain', 'An Dùbhlachd'
    ]
  ],
  [['R', 'A'], ['RC', 'AD'], ['Ro Chrìosta', 'An dèidh Chrìosta']], 1, [6, 0],
  ['dd/MM/y', 'd MMM y', 'd\'mh\' MMMM y', 'EEEE, d\'mh\' MMMM y'],
  ['HH:mm', 'HH:mm:ss', 'HH:mm:ss z', 'HH:mm:ss zzzz'],
  [
    '{1} {0}',
    ,
    ,
  ],
  ['.', ',', ';', '%', '+', '-', 'E', '×', '‰', '∞', 'NaN', ':'],
  ['#,##0.###', '#,##0%', '¤#,##0.00', '#E0'], '£', 'Punnd Sasannach',
  function(n: number):
      Plural {
        if (n === 1 || n === 11) return Plural.One;
        if (n === 2 || n === 12) return Plural.Two;
        if (n === Math.floor(n) && (n >= 3 && n <= 10 || n >= 13 && n <= 19)) return Plural.Few;
        return Plural.Other;
      }
];
