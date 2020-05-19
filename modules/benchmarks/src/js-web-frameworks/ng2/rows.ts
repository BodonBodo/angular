/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ApplicationRef, Component, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

export interface RowData {
  id: number;
  label: string;
}


@Component({
  selector: 'js-web-frameworks',
  template: `
    <table class="table table-hover table-striped test-data">
        <tbody>
            <tr [class.danger]="item.id === selected" *ngFor="let item of data; trackBy: itemById">
                <td class="col-md-1">{{item.id}}</td>
                <td class="col-md-4">
                    <a href="#" (click)="select(item.id); $event.preventDefault()">{{item.label}}</a>
                </td>
                <td class="col-md-1">
                  <a href="#" (click)="delete(item.id); $event.preventDefault()">
                    <span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
                  </a>
                </td>
                <td class="col-md-6"></td>
            </tr>
        </tbody>
    </table>
  `
})
export class JsWebFrameworksComponent {
  data: Array<RowData> = [];
  selected: number|null;

  constructor(private _appRef: ApplicationRef) {}

  itemById(index: number, item: RowData) {
    return item.id;
  }

  select(itemId: number) {
    this.selected = itemId;
    this._appRef.tick();
  }

  delete(itemId: number) {
    const data = this.data;
    for (let i = 0, l = data.length; i < l; i++) {
      if (data[i].id === itemId) {
        data.splice(i, 1);
        break;
      }
    }
    this._appRef.tick();
  }
}

@NgModule({
  imports: [BrowserModule],
  declarations: [JsWebFrameworksComponent],
  bootstrap: [JsWebFrameworksComponent],
})
export class JsWebFrameworksModule {
}
