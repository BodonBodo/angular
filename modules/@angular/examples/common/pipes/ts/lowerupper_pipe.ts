/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

// #docregion LowerUpperPipe
@Component({
  selector: 'lowerupper-pipe',
  template: `<div>
    <label>Name: </label><input #name (keyup)="change(name.value)" type="text">
    <p>In lowercase: <pre>'{{value | lowercase}}'</pre>
    <p>In uppercase: <pre>'{{value | uppercase}}'</pre>
  </div>`
})
export class LowerUpperPipeComponent {
  value: string;
  change(value: string) { this.value = value; }
}
// #enddocregion
