/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {makeTempDir} from '@angular/tsc-wrapped/test/test_support';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import {main} from '../src/main';

function getNgRootDir() {
  const moduleFilename = module.filename.replace(/\\/g, '/');
  const distIndex = moduleFilename.indexOf('/dist/all');
  return moduleFilename.substr(0, distIndex);
}

describe('compiler-cli with disableTransformerPipeline', () => {
  let basePath: string;
  let outDir: string;
  let write: (fileName: string, content: string) => void;
  let errorSpy: jasmine.Spy&((s: string) => void);

  function writeConfig(tsconfig: string = '{"extends": "./tsconfig-base.json"}') {
    const json = JSON.parse(tsconfig);
    // Note: 'extends' does not work for "angularCompilerOptions" yet.
    const ngOptions = json['angularCompilerOptions'] = json['angularCompilerOptions'] || {};
    ngOptions['disableTransformerPipeline'] = true;
    write('tsconfig.json', JSON.stringify(json));
  }

  beforeEach(() => {
    errorSpy = jasmine.createSpy('consoleError');
    basePath = makeTempDir();
    write = (fileName: string, content: string) => {
      fs.writeFileSync(path.join(basePath, fileName), content, {encoding: 'utf-8'});
    };
    write('tsconfig-base.json', `{
      "compilerOptions": {
        "experimentalDecorators": true,
        "types": [],
        "outDir": "built",
        "declaration": true,
        "module": "es2015",
        "moduleResolution": "node",
        "lib": ["es6", "dom"]
      }
    }`);
    outDir = path.resolve(basePath, 'built');
    const ngRootDir = getNgRootDir();
    const nodeModulesPath = path.resolve(basePath, 'node_modules');
    fs.mkdirSync(nodeModulesPath);
    fs.symlinkSync(
        path.resolve(ngRootDir, 'dist', 'all', '@angular'),
        path.resolve(nodeModulesPath, '@angular'));
    fs.symlinkSync(
        path.resolve(ngRootDir, 'node_modules', 'rxjs'), path.resolve(nodeModulesPath, 'rxjs'));
  });

  it('should compile without errors', (done) => {
    writeConfig();
    write('test.ts', 'export const A = 1;');

    main(['-p', basePath], errorSpy)
        .then((exitCode) => {
          expect(errorSpy).not.toHaveBeenCalled();
          expect(exitCode).toEqual(0);
          done();
        })
        .catch(e => done.fail(e));
  });

  it('should not print the stack trace if user input file does not exist', (done) => {
    writeConfig(`{
      "extends": "./tsconfig-base.json",
      "files": ["test.ts"]
    }`);

    main(['-p', basePath], errorSpy)
        .then((exitCode) => {
          expect(errorSpy).toHaveBeenCalledWith(
              `Error File '` + path.join(basePath, 'test.ts') + `' not found.`);
          expect(exitCode).toEqual(1);
          done();
        })
        .catch(e => done.fail(e));
  });

  it('should not print the stack trace if user input file is malformed', (done) => {
    writeConfig();
    write('test.ts', 'foo;');

    main(['-p', basePath], errorSpy)
        .then((exitCode) => {
          expect(errorSpy).toHaveBeenCalledWith(
              'Error at ' + path.join(basePath, 'test.ts') + `:1:1: Cannot find name 'foo'.`);
          expect(exitCode).toEqual(1);
          done();
        })
        .catch(e => done.fail(e));
  });

  it('should not print the stack trace if cannot find the imported module', (done) => {
    writeConfig();
    write('test.ts', `import {MyClass} from './not-exist-deps';`);

    main(['-p', basePath], errorSpy)
        .then((exitCode) => {
          expect(errorSpy).toHaveBeenCalledWith(
              'Error at ' + path.join(basePath, 'test.ts') +
              `:1:23: Cannot find module './not-exist-deps'.`);
          expect(exitCode).toEqual(1);
          done();
        })
        .catch(e => done.fail(e));
  });

  it('should not print the stack trace if cannot import', (done) => {
    writeConfig();
    write('empty-deps.ts', 'export const A = 1;');
    write('test.ts', `import {MyClass} from './empty-deps';`);

    main(['-p', basePath], errorSpy)
        .then((exitCode) => {
          expect(errorSpy).toHaveBeenCalledWith(
              'Error at ' + path.join(basePath, 'test.ts') + `:1:9: Module '"` +
              path.join(basePath, 'empty-deps') + `"' has no exported member 'MyClass'.`);
          expect(exitCode).toEqual(1);
          done();
        })
        .catch(e => done.fail(e));
  });

  it('should not print the stack trace if type mismatches', (done) => {
    writeConfig();
    write('empty-deps.ts', 'export const A = "abc";');
    write('test.ts', `
      import {A} from './empty-deps';
      A();
    `);

    main(['-p', basePath], errorSpy)
        .then((exitCode) => {
          expect(errorSpy).toHaveBeenCalledWith(
              'Error at ' + path.join(basePath, 'test.ts') +
              ':3:7: Cannot invoke an expression whose type lacks a call signature. ' +
              'Type \'String\' has no compatible call signatures.');
          expect(exitCode).toEqual(1);
          done();
        })
        .catch(e => done.fail(e));
  });

  it('should print the stack trace on compiler internal errors', (done) => {
    write('test.ts', 'export const A = 1;');

    main(['-p', 'not-exist'], errorSpy)
        .then((exitCode) => {
          expect(errorSpy).toHaveBeenCalled();
          expect(errorSpy.calls.mostRecent().args[0]).toContain('no such file or directory');
          expect(errorSpy.calls.mostRecent().args[0]).toContain('at Error (native)');
          expect(exitCode).toEqual(2);
          done();
        })
        .catch(e => done.fail(e));
  });

  describe('compile ngfactory files', () => {
    it('should only compile ngfactory files that are referenced by root files by default',
       (done) => {
         writeConfig(`{
          "extends": "./tsconfig-base.json",
          "files": ["mymodule.ts"]
        }`);
         write('mymodule.ts', `
        import {CommonModule} from '@angular/common';
        import {NgModule} from '@angular/core';

        @NgModule({
          imports: [CommonModule]
        })
        export class MyModule {}
      `);

         main(['-p', basePath], errorSpy)
             .then((exitCode) => {
               expect(exitCode).toEqual(0);

               expect(fs.existsSync(path.resolve(outDir, 'mymodule.ngfactory.js'))).toBe(false);

               done();
             })
             .catch(e => done.fail(e));
       });

    it('should report errors for ngfactory files that are not referenced by root files', (done) => {
      writeConfig(`{
          "extends": "./tsconfig-base.json",
          "files": ["mymodule.ts"],
          "angularCompilerOptions": {
            "alwaysCompileGeneratedCode": true
          }
        }`);
      write('mymodule.ts', `
        import {NgModule, Component} from '@angular/core';

        @Component({template: '{{unknownProp}}'})
        export class MyComp {}

        @NgModule({declarations: [MyComp]})
        export class MyModule {}
      `);

      main(['-p', basePath], errorSpy)
          .then((exitCode) => {
            expect(errorSpy).toHaveBeenCalledTimes(1);
            expect(errorSpy.calls.mostRecent().args[0])
                .toContain('Error at ' + path.join(basePath, 'mymodule.ngfactory.ts'));
            expect(errorSpy.calls.mostRecent().args[0])
                .toContain(`Property 'unknownProp' does not exist on type 'MyComp'`);

            expect(exitCode).toEqual(1);
            done();
          })
          .catch(e => done.fail(e));
    });

    it('should compile ngfactory files that are not referenced by root files', (done) => {
      writeConfig(`{
          "extends": "./tsconfig-base.json",
          "files": ["mymodule.ts"],
          "angularCompilerOptions": {
            "alwaysCompileGeneratedCode": true
          }
        }`);
      write('mymodule.ts', `
        import {CommonModule} from '@angular/common';
        import {NgModule} from '@angular/core';

        @NgModule({
          imports: [CommonModule]
        })
        export class MyModule {}
      `);

      main(['-p', basePath], errorSpy)
          .then((exitCode) => {
            expect(exitCode).toEqual(0);

            expect(fs.existsSync(path.resolve(outDir, 'mymodule.ngfactory.js'))).toBe(true);
            expect(fs.existsSync(path.resolve(
                       outDir, 'node_modules', '@angular', 'core', 'src',
                       'application_module.ngfactory.js')))
                .toBe(true);

            done();
          })
          .catch(e => done.fail(e));
    });

    it('should not produce ngsummary files by default', (done) => {
      writeConfig(`{
          "extends": "./tsconfig-base.json",
          "files": ["mymodule.ts"]
        }`);
      write('mymodule.ts', `
        import {NgModule} from '@angular/core';

        @NgModule()
        export class MyModule {}
      `);

      main(['-p', basePath], errorSpy)
          .then((exitCode) => {
            expect(exitCode).toEqual(0);
            expect(fs.existsSync(path.resolve(outDir, 'mymodule.ngsummary.js'))).toBe(false);

            done();
          })
          .catch(e => done.fail(e));
    });

    it('should produce ngsummary files if configured', (done) => {
      writeConfig(`{
          "extends": "./tsconfig-base.json",
          "files": ["mymodule.ts"],
          "angularCompilerOptions": {
            "enableSummariesForJit": true,
            "alwaysCompileGeneratedCode": true
          }
        }`);
      write('mymodule.ts', `
        import {NgModule} from '@angular/core';

        @NgModule()
        export class MyModule {}
      `);

      main(['-p', basePath], errorSpy)
          .then((exitCode) => {
            expect(exitCode).toEqual(0);
            expect(fs.existsSync(path.resolve(outDir, 'mymodule.ngsummary.js'))).toBe(true);

            done();
          })
          .catch(e => done.fail(e));
    });
  });
});
