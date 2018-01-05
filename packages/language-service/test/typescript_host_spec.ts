/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import 'reflect-metadata';
import * as ts from 'typescript';

import {TypeScriptServiceHost} from '../src/typescript_host';

import {toh} from './test_data';
import {MockTypescriptHost} from './test_utils';


describe('completions', () => {
  let host: ts.LanguageServiceHost;
  let service: ts.LanguageService;
  let ngHost: TypeScriptServiceHost;

  beforeEach(() => {
    host = new MockTypescriptHost(['/app/main.ts'], toh);
    service = ts.createLanguageService(host);
  });

  it('should be able to create a typescript host',
     () => { expect(() => new TypeScriptServiceHost(host, service)).not.toThrow(); });

  beforeEach(() => { ngHost = new TypeScriptServiceHost(host, service); });

  it('should be able to analyze modules',
     () => { expect(ngHost.getAnalyzedModules()).toBeDefined(); });

  it('should be able to analyze modules in without a tsconfig.json file', () => {
    host = new MockTypescriptHost(['foo.ts'], toh);
    service = ts.createLanguageService(host);
    ngHost = new TypeScriptServiceHost(host, service);
    expect(ngHost.getAnalyzedModules()).toBeDefined();
  });

  it('should not throw if there is no script names', () => {
    host = new MockTypescriptHost([], toh);
    service = ts.createLanguageService(host);
    ngHost = new TypeScriptServiceHost(host, service);
    expect(() => ngHost.getAnalyzedModules()).not.toThrow();
  });

  it('should clear the caches if program changes', () => {
    // First create a TypescriptHost with empty script names
    host = new MockTypescriptHost([], toh);
    service = ts.createLanguageService(host);
    ngHost = new TypeScriptServiceHost(host, service);
    expect(ngHost.getAnalyzedModules().ngModules).toEqual([]);
    // Now add a script, this would change the program
    const fileName = '/app/main.ts';
    const content = (host as MockTypescriptHost).getFileContent(fileName) !;
    (host as MockTypescriptHost).addScript(fileName, content);
    // If the caches are not cleared, we would get back an empty array.
    // But if the caches are cleared then the analyzed modules will be non-empty.
    expect(ngHost.getAnalyzedModules().ngModules.length).not.toEqual(0);
  });

});
