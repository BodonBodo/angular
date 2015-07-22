/// <reference path="../../../angular2/typings/rx/rx.all.d.ts" />

import {bootstrap} from 'angular2/bootstrap';
import {jsonpInjectables} from 'angular2/http';
import {JsonpCmp} from './jsonp_comp';

export function main() {
  bootstrap(JsonpCmp, [jsonpInjectables]);
}
