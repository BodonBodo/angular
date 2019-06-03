/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import MagicString from 'magic-string';
import * as ts from 'typescript';
import {NoopImportRewriter} from '../../../src/ngtsc/imports';
import {AbsoluteFsPath} from '../../../src/ngtsc/path';
import {ImportManager} from '../../../src/ngtsc/translator';
import {DecorationAnalyzer} from '../../src/analysis/decoration_analyzer';
import {NgccReferencesRegistry} from '../../src/analysis/ngcc_references_registry';
import {SwitchMarkerAnalyzer} from '../../src/analysis/switch_marker_analyzer';
import {CommonJsReflectionHost} from '../../src/host/commonjs_host';
import {CommonJsRenderingFormatter} from '../../src/rendering/commonjs_rendering_formatter';
import {makeTestEntryPointBundle, getDeclaration, createFileSystemFromProgramFiles} from '../helpers/utils';
import {MockFileSystem} from '../helpers/mock_file_system';
import {MockLogger} from '../helpers/mock_logger';

const _ = AbsoluteFsPath.fromUnchecked;

function setup(file: {name: AbsoluteFsPath, contents: string}) {
  const fs = new MockFileSystem(createFileSystemFromProgramFiles([file]));
  const logger = new MockLogger();
  const bundle = makeTestEntryPointBundle('module', 'commonjs', false, [file]);
  const typeChecker = bundle.src.program.getTypeChecker();
  const host = new CommonJsReflectionHost(logger, false, bundle.src.program, bundle.src.host);
  const referencesRegistry = new NgccReferencesRegistry(host);
  const decorationAnalyses =
      new DecorationAnalyzer(
          fs, bundle.src.program, bundle.src.options, bundle.src.host, typeChecker, host,
          referencesRegistry, [AbsoluteFsPath.fromUnchecked('/')], false)
          .analyzeProgram();
  const switchMarkerAnalyses = new SwitchMarkerAnalyzer(host).analyzeProgram(bundle.src.program);
  const renderer = new CommonJsRenderingFormatter(host, false);
  const importManager = new ImportManager(new NoopImportRewriter(), 'i');
  return {
    host,
    program: bundle.src.program,
    sourceFile: bundle.src.file, renderer, decorationAnalyses, switchMarkerAnalyses, importManager
  };
}

const PROGRAM = {
  name: _('/some/file.js'),
  contents: `
/* A copyright notice */
require('some-side-effect');
var core = require('@angular/core');
var A = (function() {
  function A() {}
  A.decorators = [
    { type: core.Directive, args: [{ selector: '[a]' }] },
    { type: OtherA }
  ];
  A.prototype.ngDoCheck = function() {
    //
  };
  return A;
}());

var B = (function() {
  function B() {}
  B.decorators = [
    { type: OtherB },
    { type: core.Directive, args: [{ selector: '[b]' }] }
  ];
  return B;
}());

var C = (function() {
  function C() {}
  C.decorators = [
    { type: core.Directive, args: [{ selector: '[c]' }] },
  ];
  return C;
}());

function NoIife() {}

var BadIife = (function() {
  function BadIife() {}
  BadIife.decorators = [
    { type: core.Directive, args: [{ selector: '[c]' }] },
  ];
}());

var compileNgModuleFactory = compileNgModuleFactory__PRE_R3__;
var badlyFormattedVariable = __PRE_R3__badlyFormattedVariable;
function compileNgModuleFactory__PRE_R3__(injector, options, moduleType) {
  var compilerFactory = injector.get(CompilerFactory);
  var compiler = compilerFactory.createCompiler([options]);
  return compiler.compileModuleAsync(moduleType);
}

function compileNgModuleFactory__POST_R3__(injector, options, moduleType) {
  ngDevMode && assertNgModuleType(moduleType);
  return Promise.resolve(new R3NgModuleFactory(moduleType));
}
// Some other content
exports.A = A;
exports.B = B;
exports.C = C;
exports.NoIife = NoIife;
exports.BadIife = BadIife;`
};

const PROGRAM_DECORATE_HELPER = {
  name: _('/some/file.js'),
  contents: `
var tslib_1 = require("tslib");
/* A copyright notice */
var core = require('@angular/core');
var OtherA = function () { return function (node) { }; };
var OtherB = function () { return function (node) { }; };
var A = /** @class */ (function () {
    function A() {
    }
    A = tslib_1.__decorate([
        core.Directive({ selector: '[a]' }),
        OtherA()
    ], A);
    return A;
}());
exports.A = A;
var B = /** @class */ (function () {
    function B() {
    }
    B = tslib_1.__decorate([
        OtherB(),
        core.Directive({ selector: '[b]' })
    ], B);
    return B;
}());
exports.B = B;
var C = /** @class */ (function () {
    function C() {
    }
    C = tslib_1.__decorate([
        core.Directive({ selector: '[c]' })
    ], C);
    return C;
}());
exports.C = C;
var D = /** @class */ (function () {
    function D() {
    }
    D_1 = D;
    var D_1;
    D = D_1 = tslib_1.__decorate([
        core.Directive({ selector: '[d]', providers: [D_1] })
    ], D);
    return D;
}());
exports.D = D;
// Some other content`
};

describe('CommonJsRenderingFormatter', () => {

  describe('addImports', () => {
    it('should insert the given imports after existing imports of the source file', () => {
      const {renderer, sourceFile} = setup(PROGRAM);
      const output = new MagicString(PROGRAM.contents);
      renderer.addImports(
          output,
          [
            {specifier: '@angular/core', qualifier: 'i0'},
            {specifier: '@angular/common', qualifier: 'i1'}
          ],
          sourceFile);
      expect(output.toString()).toContain(`/* A copyright notice */
require('some-side-effect');
var core = require('@angular/core');
var i0 = require('@angular/core');
var i1 = require('@angular/common');`);
    });
  });

  describe('addExports', () => {
    it('should insert the given exports at the end of the source file', () => {
      const {importManager, renderer, sourceFile} = setup(PROGRAM);
      const output = new MagicString(PROGRAM.contents);
      renderer.addExports(
          output, _(PROGRAM.name.replace(/\.js$/, '')),
          [
            {from: _('/some/a.js'), dtsFrom: _('/some/a.d.ts'), identifier: 'ComponentA1'},
            {from: _('/some/a.js'), dtsFrom: _('/some/a.d.ts'), identifier: 'ComponentA2'},
            {from: _('/some/foo/b.js'), dtsFrom: _('/some/foo/b.d.ts'), identifier: 'ComponentB'},
            {from: PROGRAM.name, dtsFrom: PROGRAM.name, identifier: 'TopLevelComponent'},
          ],
          importManager, sourceFile);
      expect(output.toString()).toContain(`
// Some other content
exports.A = A;
exports.B = B;
exports.C = C;
exports.NoIife = NoIife;
exports.BadIife = BadIife;
exports.ComponentA1 = i0.ComponentA1;
exports.ComponentA2 = i0.ComponentA2;
exports.ComponentB = i1.ComponentB;
exports.TopLevelComponent = TopLevelComponent;`);
    });

    it('should not insert alias exports in js output', () => {
      const {importManager, renderer, sourceFile} = setup(PROGRAM);
      const output = new MagicString(PROGRAM.contents);
      renderer.addExports(
          output, _(PROGRAM.name.replace(/\.js$/, '')),
          [
            {from: _('/some/a.js'), alias: _('eComponentA1'), identifier: 'ComponentA1'},
            {from: _('/some/a.js'), alias: _('eComponentA2'), identifier: 'ComponentA2'},
            {from: _('/some/foo/b.js'), alias: _('eComponentB'), identifier: 'ComponentB'},
            {from: PROGRAM.name, alias: 'eTopLevelComponent', identifier: 'TopLevelComponent'},
          ],
          importManager, sourceFile);
      const outputString = output.toString();
      expect(outputString).not.toContain(`{eComponentA1 as ComponentA1}`);
      expect(outputString).not.toContain(`{eComponentB as ComponentB}`);
      expect(outputString).not.toContain(`{eTopLevelComponent as TopLevelComponent}`);
    });
  });

  describe('addConstants', () => {
    it('should insert the given constants after imports in the source file', () => {
      const {renderer, program} = setup(PROGRAM);
      const file = program.getSourceFile('some/file.js');
      if (file === undefined) {
        throw new Error(`Could not find source file`);
      }
      const output = new MagicString(PROGRAM.contents);
      renderer.addConstants(output, 'var x = 3;', file);
      expect(output.toString()).toContain(`
var core = require('@angular/core');

var x = 3;
var A = (function() {`);
    });

    it('should insert constants after inserted imports', () => {
      const {renderer, program} = setup(PROGRAM);
      const file = program.getSourceFile('some/file.js');
      if (file === undefined) {
        throw new Error(`Could not find source file`);
      }
      const output = new MagicString(PROGRAM.contents);
      renderer.addConstants(output, 'var x = 3;', file);
      renderer.addImports(output, [{specifier: '@angular/core', qualifier: 'i0'}], file);
      expect(output.toString()).toContain(`
var core = require('@angular/core');
var i0 = require('@angular/core');

var x = 3;
var A = (function() {`);
    });
  });

  describe('rewriteSwitchableDeclarations', () => {
    it('should switch marked declaration initializers', () => {
      const {renderer, program, sourceFile, switchMarkerAnalyses} = setup(PROGRAM);
      const file = program.getSourceFile('some/file.js');
      if (file === undefined) {
        throw new Error(`Could not find source file`);
      }
      const output = new MagicString(PROGRAM.contents);
      renderer.rewriteSwitchableDeclarations(
          output, file, switchMarkerAnalyses.get(sourceFile) !.declarations);
      expect(output.toString())
          .not.toContain(`var compileNgModuleFactory = compileNgModuleFactory__PRE_R3__;`);
      expect(output.toString())
          .toContain(`var badlyFormattedVariable = __PRE_R3__badlyFormattedVariable;`);
      expect(output.toString())
          .toContain(`var compileNgModuleFactory = compileNgModuleFactory__POST_R3__;`);
      expect(output.toString())
          .toContain(`function compileNgModuleFactory__PRE_R3__(injector, options, moduleType) {`);
      expect(output.toString())
          .toContain(`function compileNgModuleFactory__POST_R3__(injector, options, moduleType) {`);
    });
  });

  describe('addDefinitions', () => {
    it('should insert the definitions directly before the return statement of the class IIFE',
       () => {
         const {renderer, decorationAnalyses, sourceFile} = setup(PROGRAM);
         const output = new MagicString(PROGRAM.contents);
         const compiledClass =
             decorationAnalyses.get(sourceFile) !.compiledClasses.find(c => c.name === 'A') !;
         renderer.addDefinitions(output, compiledClass, 'SOME DEFINITION TEXT');
         expect(output.toString()).toContain(`
  A.prototype.ngDoCheck = function() {
    //
  };
SOME DEFINITION TEXT
  return A;
`);
       });

    it('should error if the compiledClass is not valid', () => {
      const {renderer, sourceFile, program} = setup(PROGRAM);
      const output = new MagicString(PROGRAM.contents);

      const noIifeDeclaration =
          getDeclaration(program, sourceFile.fileName, 'NoIife', ts.isFunctionDeclaration);
      const mockNoIifeClass: any = {declaration: noIifeDeclaration, name: _('NoIife')};
      expect(() => renderer.addDefinitions(output, mockNoIifeClass, 'SOME DEFINITION TEXT'))
          .toThrowError(
              'Compiled class declaration is not inside an IIFE: NoIife in /some/file.js');

      const badIifeDeclaration =
          getDeclaration(program, sourceFile.fileName, 'BadIife', ts.isVariableDeclaration);
      const mockBadIifeClass: any = {declaration: badIifeDeclaration, name: _('BadIife')};
      expect(() => renderer.addDefinitions(output, mockBadIifeClass, 'SOME DEFINITION TEXT'))
          .toThrowError(
              'Compiled class wrapper IIFE does not have a return statement: BadIife in /some/file.js');
    });
  });


  describe('removeDecorators', () => {

    it('should delete the decorator (and following comma) that was matched in the analysis', () => {
      const {renderer, decorationAnalyses, sourceFile} = setup(PROGRAM);
      const output = new MagicString(PROGRAM.contents);
      const compiledClass =
          decorationAnalyses.get(sourceFile) !.compiledClasses.find(c => c.name === 'A') !;
      const decorator = compiledClass.decorators ![0];
      const decoratorsToRemove = new Map<ts.Node, ts.Node[]>();
      decoratorsToRemove.set(decorator.node.parent !, [decorator.node]);
      renderer.removeDecorators(output, decoratorsToRemove);
      expect(output.toString())
          .not.toContain(`{ type: core.Directive, args: [{ selector: '[a]' }] },`);
      expect(output.toString()).toContain(`{ type: OtherA }`);
      expect(output.toString()).toContain(`{ type: core.Directive, args: [{ selector: '[b]' }] }`);
      expect(output.toString()).toContain(`{ type: OtherB }`);
      expect(output.toString()).toContain(`{ type: core.Directive, args: [{ selector: '[c]' }] }`);
    });


    it('should delete the decorator (but cope with no trailing comma) that was matched in the analysis',
       () => {
         const {renderer, decorationAnalyses, sourceFile} = setup(PROGRAM);
         const output = new MagicString(PROGRAM.contents);
         const compiledClass =
             decorationAnalyses.get(sourceFile) !.compiledClasses.find(c => c.name === 'B') !;
         const decorator = compiledClass.decorators ![0];
         const decoratorsToRemove = new Map<ts.Node, ts.Node[]>();
         decoratorsToRemove.set(decorator.node.parent !, [decorator.node]);
         renderer.removeDecorators(output, decoratorsToRemove);
         expect(output.toString())
             .toContain(`{ type: core.Directive, args: [{ selector: '[a]' }] },`);
         expect(output.toString()).toContain(`{ type: OtherA }`);
         expect(output.toString())
             .not.toContain(`{ type: core.Directive, args: [{ selector: '[b]' }] }`);
         expect(output.toString()).toContain(`{ type: OtherB }`);
         expect(output.toString())
             .toContain(`{ type: core.Directive, args: [{ selector: '[c]' }] }`);
       });


    it('should delete the decorator (and its container if there are not other decorators left) that was matched in the analysis',
       () => {
         const {renderer, decorationAnalyses, sourceFile} = setup(PROGRAM);
         const output = new MagicString(PROGRAM.contents);
         const compiledClass =
             decorationAnalyses.get(sourceFile) !.compiledClasses.find(c => c.name === 'C') !;
         const decorator = compiledClass.decorators ![0];
         const decoratorsToRemove = new Map<ts.Node, ts.Node[]>();
         decoratorsToRemove.set(decorator.node.parent !, [decorator.node]);
         renderer.removeDecorators(output, decoratorsToRemove);
         renderer.addDefinitions(output, compiledClass, 'SOME DEFINITION TEXT');
         expect(output.toString())
             .toContain(`{ type: core.Directive, args: [{ selector: '[a]' }] },`);
         expect(output.toString()).toContain(`{ type: OtherA }`);
         expect(output.toString())
             .toContain(`{ type: core.Directive, args: [{ selector: '[b]' }] }`);
         expect(output.toString()).toContain(`{ type: OtherB }`);
         expect(output.toString()).toContain(`function C() {}\nSOME DEFINITION TEXT\n  return C;`);
         expect(output.toString()).not.toContain(`C.decorators`);
       });

  });

  describe('[__decorate declarations]', () => {
    it('should delete the decorator (and following comma) that was matched in the analysis', () => {
      const {renderer, decorationAnalyses, sourceFile} = setup(PROGRAM_DECORATE_HELPER);
      const output = new MagicString(PROGRAM_DECORATE_HELPER.contents);
      const compiledClass =
          decorationAnalyses.get(sourceFile) !.compiledClasses.find(c => c.name === 'A') !;
      const decorator = compiledClass.decorators !.find(d => d.name === 'Directive') !;
      const decoratorsToRemove = new Map<ts.Node, ts.Node[]>();
      decoratorsToRemove.set(decorator.node.parent !, [decorator.node]);
      renderer.removeDecorators(output, decoratorsToRemove);
      expect(output.toString()).not.toContain(`Directive({ selector: '[a]' }),`);
      expect(output.toString()).toContain(`OtherA()`);
      expect(output.toString()).toContain(`Directive({ selector: '[b]' })`);
      expect(output.toString()).toContain(`OtherB()`);
      expect(output.toString()).toContain(`Directive({ selector: '[c]' })`);
    });

    it('should delete the decorator (but cope with no trailing comma) that was matched in the analysis',
       () => {
         const {renderer, decorationAnalyses, sourceFile} = setup(PROGRAM_DECORATE_HELPER);
         const output = new MagicString(PROGRAM_DECORATE_HELPER.contents);
         const compiledClass =
             decorationAnalyses.get(sourceFile) !.compiledClasses.find(c => c.name === 'B') !;
         const decorator = compiledClass.decorators !.find(d => d.name === 'Directive') !;
         const decoratorsToRemove = new Map<ts.Node, ts.Node[]>();
         decoratorsToRemove.set(decorator.node.parent !, [decorator.node]);
         renderer.removeDecorators(output, decoratorsToRemove);
         expect(output.toString()).toContain(`Directive({ selector: '[a]' }),`);
         expect(output.toString()).toContain(`OtherA()`);
         expect(output.toString()).not.toContain(`Directive({ selector: '[b]' })`);
         expect(output.toString()).toContain(`OtherB()`);
         expect(output.toString()).toContain(`Directive({ selector: '[c]' })`);
       });


    it('should delete the decorator (and its container if there are no other decorators left) that was matched in the analysis',
       () => {
         const {renderer, decorationAnalyses, sourceFile} = setup(PROGRAM_DECORATE_HELPER);
         const output = new MagicString(PROGRAM_DECORATE_HELPER.contents);
         const compiledClass =
             decorationAnalyses.get(sourceFile) !.compiledClasses.find(c => c.name === 'C') !;
         const decorator = compiledClass.decorators !.find(d => d.name === 'Directive') !;
         const decoratorsToRemove = new Map<ts.Node, ts.Node[]>();
         decoratorsToRemove.set(decorator.node.parent !, [decorator.node]);
         renderer.removeDecorators(output, decoratorsToRemove);
         expect(output.toString()).toContain(`Directive({ selector: '[a]' }),`);
         expect(output.toString()).toContain(`OtherA()`);
         expect(output.toString()).toContain(`Directive({ selector: '[b]' })`);
         expect(output.toString()).toContain(`OtherB()`);
         expect(output.toString()).not.toContain(`Directive({ selector: '[c]' })`);
         expect(output.toString()).not.toContain(`C = tslib_1.__decorate([`);
         expect(output.toString()).toContain(`function C() {\n    }\n    return C;`);
       });
  });
});
