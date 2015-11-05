/**
 * @module
 * @description
 * This module provides a set of common Pipes.
 */
import {AsyncPipe} from './async_pipe';
import {UpperCasePipe} from './uppercase_pipe';
import {LowerCasePipe} from './lowercase_pipe';
import {JsonPipe} from './json_pipe';
import {SlicePipe} from './slice_pipe';
import {DatePipe} from './date_pipe';
import {DecimalPipe, PercentPipe, CurrencyPipe} from './number_pipe';
import {CONST_EXPR} from 'angular2/src/core/facade/lang';

export const COMMON_PIPES = CONST_EXPR([
  AsyncPipe,
  UpperCasePipe,
  LowerCasePipe,
  JsonPipe,
  SlicePipe,
  DecimalPipe,
  PercentPipe,
  CurrencyPipe,
  DatePipe
]);
