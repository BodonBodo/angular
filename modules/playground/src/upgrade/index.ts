/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, EventEmitter, Input, NgModule, Output, forwardRef} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {UpgradeAdapter} from '@angular/upgrade';

declare var angular: any;


var styles = [`
    .border {
      border: solid 2px DodgerBlue;
    }
    .title {
      background-color: LightSkyBlue;
      padding: .2em 1em;
      font-size: 1.2em;
    }
    .content {
      padding: 1em;
    }
  `];

var adapter = new UpgradeAdapter(forwardRef(() => Ng2AppModule));
var ng1module = angular.module('myExample', []);

ng1module.controller('Index', function($scope: any /** TODO #9100 */) { $scope.name = 'World'; });

ng1module.directive('ng1User', function() {
  return {
    scope: {handle: '@', reset: '&'},
    template: `
      User: {{handle}}
      <hr>
      <button ng-click="reset()">clear</button>`
  };
});

@Component({
  selector: 'pane',
  template: `<div class="border">
    <div class="title">{{title}}</div>
    <div class="content"><ng-content></ng-content></div>
    </div>`,
  styles: styles
})
class Pane {
  @Input() title: string;
}


@Component({
  selector: 'upgrade-app',
  template: `<div class="border">
      <pane title="Title: {{user}}">
        <table cellpadding="3">
          <tr>
            <td><ng-content></ng-content></td>
            <td><ng1-user [handle]="user" (reset)="reset.emit()"></ng1-user></td>
          </tr>
        </table>
      </pane>
    </div>`,
  styles: styles
})
class UpgradeApp {
  @Input() user: string;
  @Output() reset = new EventEmitter();
  constructor() {}
}

@NgModule({
  declarations: [Pane, UpgradeApp, adapter.upgradeNg1Component('ng1User')],
  imports: [BrowserModule]
})
class Ng2AppModule {
}


ng1module.directive('upgradeApp', adapter.downgradeNg2Component(UpgradeApp));

export function main() {
  adapter.bootstrap(document.body, ['myExample']);
}
