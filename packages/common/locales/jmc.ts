/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// THIS CODE IS GENERATED - DO NOT MODIFY
// See angular/tools/gulp-tasks/cldr/extract.js

const u = undefined;

function plural(n: number): number {
  if (n === 1) return 1;
  return 5;
}

export default [
  'jmc',
  [['utuko', 'kyiukonyi'], u, u],
  u,
  [
    ['J', 'J', 'J', 'J', 'A', 'I', 'J'], ['Jpi', 'Jtt', 'Jnn', 'Jtn', 'Alh', 'Iju', 'Jmo'],
    ['Jumapilyi', 'Jumatatuu', 'Jumanne', 'Jumatanu', 'Alhamisi', 'Ijumaa', 'Jumamosi'],
    ['Jpi', 'Jtt', 'Jnn', 'Jtn', 'Alh', 'Iju', 'Jmo']
  ],
  u,
  [
    ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
    ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Des'],
    [
      'Januari', 'Februari', 'Machi', 'Aprilyi', 'Mei', 'Junyi', 'Julyai', 'Agusti', 'Septemba',
      'Oktoba', 'Novemba', 'Desemba'
    ]
  ],
  u,
  [['KK', 'BK'], u, ['Kabla ya Kristu', 'Baada ya Kristu']],
  1,
  [6, 0],
  ['dd/MM/y', 'd MMM y', 'd MMMM y', 'EEEE, d MMMM y'],
  ['HH:mm', 'HH:mm:ss', 'HH:mm:ss z', 'HH:mm:ss zzzz'],
  ['{1} {0}', u, u, u],
  ['.', ',', ';', '%', '+', '-', 'E', '×', '‰', '∞', 'NaN', ':'],
  ['#,##0.###', '#,##0%', '¤#,##0.00', '#E0'],
  'TZS',
  'TSh',
  'Shilingi ya Tanzania',
  {'JPY': ['JP¥', '¥'], 'TZS': ['TSh'], 'USD': ['US$', '$']},
  'ltr',
  plural
];
