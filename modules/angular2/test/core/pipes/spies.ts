import {ChangeDetectorRef_} from 'angular2/src/core/change_detection/change_detector_ref';

import {SpyObject, proxy} from 'angular2/test_lib';

export class SpyChangeDetectorRef extends SpyObject {
  constructor() { super(ChangeDetectorRef_); }
}