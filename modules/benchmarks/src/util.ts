/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

urlParamsToForm();

export function getIntParameter(name: string) {
  return parseInt(getStringParameter(name), 10);
}

export function getStringParameter(name: string) {
  const els = document.querySelectorAll(`input[name="${name}"]`);
  let value: any;
  let el: any;

  for (let i = 0; i < els.length; i++) {
    el = els[i];
    const type = el.type;
    if ((type != 'radio' && type != 'checkbox') || el.checked) {
      value = el.value;
      break;
    }
  }

  if (value == null) {
    throw new Error(`Could not find and input field with name ${name}`);
  }

  return value;
}

export function bindAction(selector: string, callback: () => void) {
  document.querySelector(selector).addEventListener('click', callback);
}


export function profile(create: () => void, destroy: () => void, name: string) {
  return function() {
    window.console.profile(name + ' w GC');
    let duration = 0;
    let count = 0;
    while (count++ < 150) {
      (<any>window)['gc']();
      const start = window.performance.now();
      create();
      duration += window.performance.now() - start;
      destroy();
    }
    window.console.profileEnd();
    window.console.log(`Iterations: ${count}; time: ${duration / count} ms / iteration`);

    window.console.profile(name + ' w/o GC');
    duration = 0;
    count = 0;
    while (count++ < 150) {
      const start = window.performance.now();
      create();
      duration += window.performance.now() - start;
      destroy();
    }
    window.console.profileEnd();
    window.console.log(`Iterations: ${count}; time: ${duration / count} ms / iteration`);
  };
}

// helper script that will read out the url parameters
// and store them in appropriate form fields on the page
function urlParamsToForm() {
  const regex = /(\w+)=(\w+)/g;
  const search = decodeURIComponent(location.search);
  let match: any[];
  while (match = regex.exec(search)) {
    const name = match[1];
    const value = match[2];
    const els = document.querySelectorAll('input[name="' + name + '"]');
    let el: any;
    for (let i = 0; i < els.length; i++) {
      el = els[i];
      if (el.type === 'radio' || el.type === 'checkbox') {
        el.checked = el.value === value;
      } else {
        el.value = value;
      }
    }
  }
}