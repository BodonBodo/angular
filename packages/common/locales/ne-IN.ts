/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// THIS CODE IS GENERATED - DO NOT MODIFY
// See angular/tools/gulp-tasks/cldr/extract.js

function plural(n: number): number {
  if (n === 1) return 1;
  return 5;
}

export default [
  'ne-IN',
  [
    ['पूर्वाह्न', 'अपराह्न'],
    ,
  ],
  ,
  [
    ['आ', 'सो', 'म', 'बु', 'बि', 'शु', 'श'],
    [
      'आइत', 'सोम', 'मङ्गल', 'बुध', 'बिहि', 'शुक्र',
      'शनि'
    ],
    [
      'आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार',
      'बिहिबार', 'शुक्रबार', 'शनिबार'
    ],
    [
      'आइत', 'सोम', 'मङ्गल', 'बुध', 'बिहि', 'शुक्र',
      'शनि'
    ]
  ],
  ,
  [
    [
      'जन', 'फेब', 'मार्च', 'अप्र', 'मे', 'जुन', 'जुल',
      'अग', 'सेप', 'अक्टो', 'नोभे', 'डिसे'
    ],
    [
      'जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल',
      'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर',
      'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'
    ],
  ],
  [
    [
      'जन', 'फेेब', 'मार्च', 'अप्र', 'मे', 'जुन',
      'जुल', 'अग', 'सेप', 'अक्टो', 'नोभे', 'डिसे'
    ],
    [
      'जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल',
      'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर',
      'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'
    ],
  ],
  [
    ['ईसा पूर्व', 'सन्'],
    ,
  ],
  0, [0, 0], ['yy/M/d', 'y MMM d', 'y MMMM d', 'y MMMM d, EEEE'],
  ['h:mm a', 'h:mm:ss a', 'h:mm:ss a z', 'h:mm:ss a zzzz'],
  [
    '{1}, {0}',
    ,
    '{1} {0}',
  ],
  ['.', ',', ';', '%', '+', '-', 'E', '×', '‰', '∞', 'NaN', ':'],
  ['#,##0.###', '#,##0%', '¤ #,##0.00', '#E0'], '₹', 'भारतीय रूपिँया',
  {'JPY': ['JP¥', '¥'], 'NPR': ['नेरू', 'रू'], 'THB': ['฿'], 'USD': ['US$', '$']},
  plural
];
