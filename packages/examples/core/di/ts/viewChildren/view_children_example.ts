/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

// #docregion Component
import {AfterViewInit, Component, Directive, Input, QueryList, ViewChildren} from '@angular/core';

@Directive({selector: 'pane'})
export class Pane {
  // TODO(issue/24571): remove '!'.
  @Input() id !: string;
}

@Component({
  selector: 'example-app',
  template: `
    <pane id="1"></pane>
    <pane id="2"></pane>
    <pane id="3" *ngIf="shouldShow"></pane>
    
    <button (click)="show()">Show 3</button>
       
    <div>panes: {{serializedPanes}}</div> 
  `,
})
export class ViewChildrenComp implements AfterViewInit {
  // TODO(issue/24571): remove '!'.
  @ViewChildren(Pane) panes !: QueryList<Pane>;
  serializedPanes: string = '';

  shouldShow = false;

  show() { this.shouldShow = true; }

  ngAfterViewInit() {
    this.calculateSerializedPanes();
    this.panes.changes.subscribe((r) => { this.calculateSerializedPanes(); });
  }

  calculateSerializedPanes() {
    setTimeout(() => { this.serializedPanes = this.panes.map(p => p.id).join(', '); }, 0);
  }
}
// #enddocregion
