/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CommonModule} from '@angular/common';
import {AfterViewInit, Component, NgModule, ViewChild, ViewEncapsulation} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {BenchmarkModule} from './benchmark_module';
import {BenchmarkableExpandingRow} from './benchmarkable_expanding_row';
import {BenchmarkableExpandingRowModule} from './benchmarkable_expanding_row_module';

@Component({
  selector: 'benchmark-root',
  encapsulation: ViewEncapsulation.None,
  template: `
    <h2>cfc-expanding-row initialization benchmark</h2>

    <section>
      <button id="reset" (click)="reset()">Reset</button>
      <button (click)="handleInitClick()">Init</button>
      <button id="run" (click)="runAll()">Run All</button>
    </section>

    <benchmark-area>
      <benchmarkable-expanding-row></benchmarkable-expanding-row>
    </benchmark-area>`,
})
export class InitializationRoot implements AfterViewInit {
  @ViewChild(BenchmarkableExpandingRow, {static: true})
  expandingRow !: BenchmarkableExpandingRow;

  ngAfterViewInit() {}

  reset() { this.expandingRow.reset(); }

  async runAll() {
    await execTimed('initialization_benchmark', async() => { await this.doInit(); });
  }

  async handleInitClick() { await this.doInit(); }

  private async doInit() {
    await execTimed('initial_load', async() => { this.expandingRow.init(); });
  }
}

@NgModule({
  declarations: [InitializationRoot],
  exports: [InitializationRoot],
  imports: [
    CommonModule,
    BenchmarkableExpandingRowModule,
    BenchmarkModule,
    BrowserModule,
  ],
  bootstrap: [InitializationRoot],
})
// Component benchmarks must export a BenchmarkModule.
export class ExpandingRowBenchmarkModule {
}

export async function execTimed(description: string, func: () => Promise<void>) {
  console.time(description);
  await func();
  await nextTick(200);
  console.timeEnd(description);
}

export async function nextTick(delay = 1) {
  return new Promise((res, rej) => { setTimeout(() => { res(); }, delay); });
}
