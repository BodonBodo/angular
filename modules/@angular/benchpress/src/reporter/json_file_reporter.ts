/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Inject, Injectable, OpaqueToken} from '@angular/core';

import {Options} from '../common_options';
import {DateWrapper, Json, isBlank, isPresent} from '../facade/lang';
import {MeasureValues} from '../measure_values';
import {Reporter} from '../reporter';
import {SampleDescription} from '../sample_description';



/**
 * A reporter that writes results into a json file.
 */
@Injectable()
export class JsonFileReporter extends Reporter {
  static PATH = new OpaqueToken('JsonFileReporter.path');
  static PROVIDERS = [JsonFileReporter, {provide: JsonFileReporter.PATH, useValue: '.'}];

  constructor(
      private _description: SampleDescription, @Inject(JsonFileReporter.PATH) private _path: string,
      @Inject(Options.WRITE_FILE) private _writeFile: Function,
      @Inject(Options.NOW) private _now: Function) {
    super();
  }

  reportMeasureValues(measureValues: MeasureValues): Promise<any> { return Promise.resolve(null); }

  reportSample(completeSample: MeasureValues[], validSample: MeasureValues[]): Promise<any> {
    var content = Json.stringify({
      'description': this._description,
      'completeSample': completeSample,
      'validSample': validSample
    });
    var filePath =
        `${this._path}/${this._description.id}_${DateWrapper.toMillis(this._now())}.json`;
    return this._writeFile(filePath, content);
  }
}
