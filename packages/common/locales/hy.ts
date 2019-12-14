/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// THIS CODE IS GENERATED - DO NOT MODIFY
// See angular/tools/gulp-tasks/cldr/extract.js

const u = undefined;

function plural(n: number): number {
  let i = Math.floor(Math.abs(n));
  if (i === 0 || i === 1) return 1;
  return 5;
}

export default [
  'hy',
  [['ա', 'հ'], ['AM', 'PM'], u],
  [['AM', 'PM'], u, u],
  [
    ['Կ', 'Ե', 'Ե', 'Չ', 'Հ', 'Ո', 'Շ'],
    ['կիր', 'երկ', 'երք', 'չրք', 'հնգ', 'ուր', 'շբթ'],
    [
      'կիրակի', 'երկուշաբթի', 'երեքշաբթի', 'չորեքշաբթի',
      'հինգշաբթի', 'ուրբաթ', 'շաբաթ'
    ],
    ['կր', 'եկ', 'եք', 'չք', 'հգ', 'ու', 'շբ']
  ],
  u,
  [
    ['Հ', 'Փ', 'Մ', 'Ա', 'Մ', 'Հ', 'Հ', 'Օ', 'Ս', 'Հ', 'Ն', 'Դ'],
    [
      'հնվ', 'փտվ', 'մրտ', 'ապր', 'մյս', 'հնս', 'հլս', 'օգս', 'սեպ',
      'հոկ', 'նոյ', 'դեկ'
    ],
    [
      'հունվարի', 'փետրվարի', 'մարտի', 'ապրիլի', 'մայիսի',
      'հունիսի', 'հուլիսի', 'օգոստոսի', 'սեպտեմբերի',
      'հոկտեմբերի', 'նոյեմբերի', 'դեկտեմբերի'
    ]
  ],
  [
    ['Հ', 'Փ', 'Մ', 'Ա', 'Մ', 'Հ', 'Հ', 'Օ', 'Ս', 'Հ', 'Ն', 'Դ'],
    [
      'հնվ', 'փտվ', 'մրտ', 'ապր', 'մյս', 'հնս', 'հլս', 'օգս', 'սեպ',
      'հոկ', 'նոյ', 'դեկ'
    ],
    [
      'հունվար', 'փետրվար', 'մարտ', 'ապրիլ', 'մայիս', 'հունիս',
      'հուլիս', 'օգոստոս', 'սեպտեմբեր', 'հոկտեմբեր',
      'նոյեմբեր', 'դեկտեմբեր'
    ]
  ],
  [['մ.թ.ա.', 'մ.թ.'], u, ['Քրիստոսից առաջ', 'Քրիստոսից հետո']],
  1,
  [6, 0],
  ['dd.MM.yy', 'dd MMM, y թ.', 'dd MMMM, y թ.', 'y թ. MMMM d, EEEE'],
  ['HH:mm', 'HH:mm:ss', 'HH:mm:ss z', 'HH:mm:ss zzzz'],
  ['{1}, {0}', u, u, u],
  [',', ' ', ';', '%', '+', '-', 'E', '×', '‰', '∞', 'ՈչԹ', ':'],
  ['#,##0.###', '#,##0%', '#,##0.00 ¤', '#E0'],
  'AMD',
  '֏',
  'հայկական դրամ',
  {'AMD': ['֏'], 'JPY': ['JP¥', '¥'], 'THB': ['฿'], 'TWD': ['NT$']},
  'ltr',
  plural
];
