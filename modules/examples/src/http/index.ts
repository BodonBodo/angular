import {bootstrap} from 'angular2/bootstrap';
import {HTTP_BINDINGS} from 'angular2/http';
import {HttpCmp} from './http_comp';

export function main() {
  bootstrap(HttpCmp, [HTTP_BINDINGS]);
}
