#!/usr/bin/env node
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


// Must be imported first, because angular2 decorators throws on load.
import 'reflect-metadata';

import * as ts from 'typescript';
import * as tsc from '@angular/tsc-wrapped';

import {CodeGenerator} from './codegen';

function codegen(
    ngOptions: tsc.AngularCompilerOptions, program: ts.Program, host: ts.CompilerHost) {
  return CodeGenerator.create(ngOptions, program, host).codegen();
}

// CLI entry point
if (require.main === module) {
  const args = require('minimist')(process.argv.slice(2));
  tsc.main(args.p || args.project || '.', args.basePath, codegen)
      .then(exitCode => process.exit(exitCode))
      .catch(e => {
        console.error(e.stack);
        console.error('Compilation failed');
        process.exit(1);
      });
}
