import {NgZone} from 'angular2/src/core/zone/ng_zone';

export class MockNgZone extends NgZone {
  constructor() { super({enableLongStackTrace: false}); }

  run(fn): any { return fn(); }

  runOutsideAngular(fn): any { return fn(); }
}
