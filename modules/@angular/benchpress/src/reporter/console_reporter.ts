/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Inject, Injectable, OpaqueToken} from '@angular/core';

import {ListWrapper, StringMapWrapper} from '../facade/collection';
import {NumberWrapper, isBlank, isPresent, print} from '../facade/lang';
import {Math} from '../facade/math';
import {MeasureValues} from '../measure_values';
import {Reporter} from '../reporter';
import {SampleDescription} from '../sample_description';
import {Statistic} from '../statistic';


/**
 * A reporter for the console
 */
@Injectable()
export class ConsoleReporter extends Reporter {
  static PRINT = new OpaqueToken('ConsoleReporter.print');
  static COLUMN_WIDTH = new OpaqueToken('ConsoleReporter.columnWidth');
  static PROVIDERS = [
    ConsoleReporter, {provide: ConsoleReporter.COLUMN_WIDTH, useValue: 18},
    {provide: ConsoleReporter.PRINT, useValue: print}
  ];

  private static _lpad(value: string, columnWidth: number, fill = ' ') {
    var result = '';
    for (var i = 0; i < columnWidth - value.length; i++) {
      result += fill;
    }
    return result + value;
  }

  private static _formatNum(n: number) { return NumberWrapper.toFixed(n, 2); }

  private static _sortedProps(obj: {[key: string]: any}) {
    var props: string[] = [];
    StringMapWrapper.forEach(obj, (value, prop) => props.push(prop));
    props.sort();
    return props;
  }

  private _metricNames: string[];

  constructor(
      @Inject(ConsoleReporter.COLUMN_WIDTH) private _columnWidth: number,
      sampleDescription: SampleDescription,
      @Inject(ConsoleReporter.PRINT) private _print: Function) {
    super();
    this._metricNames = ConsoleReporter._sortedProps(sampleDescription.metrics);
    this._printDescription(sampleDescription);
  }

  private _printDescription(sampleDescription: SampleDescription) {
    this._print(`BENCHMARK ${sampleDescription.id}`);
    this._print('Description:');
    var props = ConsoleReporter._sortedProps(sampleDescription.description);
    props.forEach((prop) => { this._print(`- ${prop}: ${sampleDescription.description[prop]}`); });
    this._print('Metrics:');
    this._metricNames.forEach((metricName) => {
      this._print(`- ${metricName}: ${sampleDescription.metrics[metricName]}`);
    });
    this._print('');
    this._printStringRow(this._metricNames);
    this._printStringRow(this._metricNames.map((_) => ''), '-');
  }

  reportMeasureValues(measureValues: MeasureValues): Promise<any> {
    var formattedValues = this._metricNames.map(metricName => {
      var value = measureValues.values[metricName];
      return ConsoleReporter._formatNum(value);
    });
    this._printStringRow(formattedValues);
    return Promise.resolve(null);
  }

  reportSample(completeSample: MeasureValues[], validSamples: MeasureValues[]): Promise<any> {
    this._printStringRow(this._metricNames.map((_) => ''), '=');
    this._printStringRow(this._metricNames.map(metricName => {
      var samples = validSamples.map(measureValues => measureValues.values[metricName]);
      var mean = Statistic.calculateMean(samples);
      var cv = Statistic.calculateCoefficientOfVariation(samples, mean);
      var formattedMean = ConsoleReporter._formatNum(mean);
      // Note: Don't use the unicode character for +- as it might cause
      // hickups for consoles...
      return NumberWrapper.isNaN(cv) ? formattedMean : `${formattedMean}+-${Math.floor(cv)}%`;
    }));
    return Promise.resolve(null);
  }

  private _printStringRow(parts: any[], fill = ' ') {
    this._print(
        parts.map(part => ConsoleReporter._lpad(part, this._columnWidth, fill)).join(' | '));
  }
}
