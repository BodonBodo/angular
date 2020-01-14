/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ApplicationRef, NgModuleRef} from '@angular/core';
import {bindAction, profile} from '../../util';
import {StylingModule} from './styling';

const empty = [];
const items = [];
for (let i = 0; i < 2000; i++) {
  items.push(i);
}


export function init(moduleRef: NgModuleRef<StylingModule>) {
  const injector = moduleRef.injector;
  const appRef = injector.get(ApplicationRef);
  const componentRef = appRef.components[0];
  const component = componentRef.instance;
  const componentHostEl = componentRef.location.nativeElement;
  const select = document.querySelector('#scenario-select') !as HTMLSelectElement;

  function create(tplRefIdx: number) {
    component.tplRefIdx = tplRefIdx;
    component.data = items;
    appRef.tick();
  }

  function destroy() {
    component.data = empty;
    appRef.tick();
  }

  function update() {
    component.exp = component.exp === 'bar' ? 'baz' : 'bar';
    appRef.tick();
  }

  function detectChanges() { appRef.tick(); }

  function modifyExternally() {
    const buttonEls = componentHostEl.querySelectorAll('button') as HTMLButtonElement[];
    buttonEls.forEach((buttonEl: HTMLButtonElement) => {
      const cl = buttonEl.classList;
      if (cl.contains('external')) {
        cl.remove('external');
      } else {
        cl.add('external');
      }
    });
  }

  bindAction('#create', () => create(select.selectedIndex));
  bindAction('#update', update);
  bindAction('#detect_changes', detectChanges);
  bindAction('#destroy', destroy);
  bindAction('#profile_update', profile(() => {
               for (let i = 0; i < 10; i++) {
                 update();
               }
             }, () => {}, 'update and detect changes'));
  bindAction('#profile_detect_changes', profile(() => {
               for (let i = 0; i < 10; i++) {
                 detectChanges();
               }
             }, () => {}, 'noop detect changes'));
  bindAction('#modify', modifyExternally);
}
