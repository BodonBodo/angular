/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AbsoluteFsPath} from '../../../src/ngtsc/path';
import {FileSystem} from '../../src/file_system/file_system';
import {EntryPoint, EntryPointFormat, EntryPointJsonProperty, getEntryPointInfo} from '../../src/packages/entry_point';
import {EntryPointBundle, makeEntryPointBundle} from '../../src/packages/entry_point_bundle';
import {FileWriter} from '../../src/writing/file_writer';
import {NewEntryPointFileWriter} from '../../src/writing/new_entry_point_file_writer';
import {MockFileSystem} from '../helpers/mock_file_system';
import {MockLogger} from '../helpers/mock_logger';
import {loadPackageJson} from '../packages/entry_point_spec';

const _ = AbsoluteFsPath.from;

function createMockFileSystem() {
  return new MockFileSystem({
    '/node_modules/test': {
      'package.json':
          '{"module": "./esm5.js", "es2015": "./es2015/index.js", "typings": "./index.d.ts"}',
      'index.d.ts': 'export declare class FooTop {}',
      'index.d.ts.map': 'ORIGINAL MAPPING DATA',
      'index.metadata.json': '...',
      'esm5.js': 'export function FooTop() {}',
      'esm5.js.map': 'ORIGINAL MAPPING DATA',
      'es2015': {
        'index.js': 'export {FooTop} from "./foo";',
        'foo.js': 'export class FooTop {}',
      },
      'a': {
        'package.json':
            '{"module": "./esm5.js", "es2015": "./es2015/index.js", "typings": "./index.d.ts"}',
        'index.d.ts': 'export declare class FooA {}',
        'index.metadata.json': '...',
        'esm5.js': 'export function FooA() {}',
        'es2015': {
          'index.js': 'export {FooA} from "./foo";',
          'foo.js': 'export class FooA {}',
        },
      },
      'b': {
        // This entry-point points to files outside its folder
        'package.json':
            '{"module": "../lib/esm5.js", "es2015": "../lib/es2015/index.js", "typings": "../typings/index.d.ts"}',
      },
      'lib': {
        'esm5.js': 'export function FooB() {}',
        'es2015': {
          'index.js': 'export {FooB} from "./foo"; import * from "other";',
          'foo.js': 'import {FooA} from "test/a"; import "events"; export class FooB {}',
        },
      },
      'typings': {
        'index.d.ts': 'export declare class FooB {}',
        'index.metadata.json': '...',
      }
    },
    '/node_modules/other': {
      'package.json': '{"module": "./esm5.js", "typings": "./index.d.ts"}',
      'index.d.ts': 'export declare class OtherClass {}',
      'esm5.js': 'export class OtherClass {}',
    },
    '/node_modules/events': {
      'package.json': '{"main": "./events.js"}',
      'events.js': 'export class OtherClass {}',
    },
  });
}

describe('NewEntryPointFileWriter', () => {
  let fs: FileSystem;
  let fileWriter: FileWriter;
  let entryPoint: EntryPoint;
  let esm5bundle: EntryPointBundle;
  let esm2015bundle: EntryPointBundle;

  describe('writeBundle() [primary entry-point]', () => {
    beforeEach(() => {
      fs = createMockFileSystem();
      fileWriter = new NewEntryPointFileWriter(fs);
      entryPoint = getEntryPointInfo(
          fs, new MockLogger(), _('/node_modules/test'), _('/node_modules/test')) !;
      esm5bundle = makeTestBundle(fs, entryPoint, 'module', 'esm5');
      esm2015bundle = makeTestBundle(fs, entryPoint, 'es2015', 'esm2015');
    });

    it('should write the modified files to a new folder', () => {
      fileWriter.writeBundle(entryPoint, esm5bundle, [
        {
          path: _('/node_modules/test/esm5.js'),
          contents: 'export function FooTop() {} // MODIFIED'
        },
        {path: _('/node_modules/test/esm5.js.map'), contents: 'MODIFIED MAPPING DATA'},
      ]);
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/esm5.js')))
          .toEqual('export function FooTop() {} // MODIFIED');
      expect(fs.readFile(_('/node_modules/test/esm5.js'))).toEqual('export function FooTop() {}');
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/esm5.js.map')))
          .toEqual('MODIFIED MAPPING DATA');
      expect(fs.readFile(_('/node_modules/test/esm5.js.map'))).toEqual('ORIGINAL MAPPING DATA');
    });

    it('should also copy unmodified files in the program', () => {
      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/es2015/foo.js'),
          contents: 'export class FooTop {} // MODIFIED'
        },
      ]);
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/es2015/foo.js')))
          .toEqual('export class FooTop {} // MODIFIED');
      expect(fs.readFile(_('/node_modules/test/es2015/foo.js'))).toEqual('export class FooTop {}');
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/es2015/index.js')))
          .toEqual('export {FooTop} from "./foo";');
      expect(fs.readFile(_('/node_modules/test/es2015/index.js')))
          .toEqual('export {FooTop} from "./foo";');
    });

    it('should update the package.json properties', () => {
      fileWriter.writeBundle(entryPoint, esm5bundle, [
        {
          path: _('/node_modules/test/esm5.js'),
          contents: 'export function FooTop() {} // MODIFIED'
        },
      ]);
      expect(loadPackageJson(fs, '/node_modules/test')).toEqual(jasmine.objectContaining({
        module_ivy_ngcc: '__ivy_ngcc__/esm5.js',
      }));

      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/es2015/foo.js'),
          contents: 'export class FooTop {} // MODIFIED'
        },
      ]);
      expect(loadPackageJson(fs, '/node_modules/test')).toEqual(jasmine.objectContaining({
        module_ivy_ngcc: '__ivy_ngcc__/esm5.js',
        es2015_ivy_ngcc: '__ivy_ngcc__/es2015/index.js',
      }));
    });

    it('should overwrite and backup typings files', () => {
      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/index.d.ts'),
          contents: 'export declare class FooTop {} // MODIFIED'
        },
        {path: _('/node_modules/test/index.d.ts.map'), contents: 'MODIFIED MAPPING DATA'},
      ]);
      expect(fs.readFile(_('/node_modules/test/index.d.ts')))
          .toEqual('export declare class FooTop {} // MODIFIED');
      expect(fs.readFile(_('/node_modules/test/index.d.ts.__ivy_ngcc_bak')))
          .toEqual('export declare class FooTop {}');
      expect(fs.exists(_('/node_modules/test/__ivy_ngcc__/index.d.ts'))).toBe(false);

      expect(fs.readFile(_('/node_modules/test/index.d.ts.map'))).toEqual('MODIFIED MAPPING DATA');
      expect(fs.readFile(_('/node_modules/test/index.d.ts.map.__ivy_ngcc_bak')))
          .toEqual('ORIGINAL MAPPING DATA');
      expect(fs.exists(_('/node_modules/test/__ivy_ngcc__/index.d.ts.map'))).toBe(false);
    });
  });

  describe('writeBundle() [secondary entry-point]', () => {
    beforeEach(() => {
      fs = createMockFileSystem();
      fileWriter = new NewEntryPointFileWriter(fs);
      entryPoint = getEntryPointInfo(
          fs, new MockLogger(), _('/node_modules/test'), _('/node_modules/test/a')) !;
      esm5bundle = makeTestBundle(fs, entryPoint, 'module', 'esm5');
      esm2015bundle = makeTestBundle(fs, entryPoint, 'es2015', 'esm2015');
    });

    it('should write the modified file to a new folder', () => {
      fileWriter.writeBundle(entryPoint, esm5bundle, [
        {
          path: _('/node_modules/test/a/esm5.js'),
          contents: 'export function FooA() {} // MODIFIED'
        },
      ]);
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/a/esm5.js')))
          .toEqual('export function FooA() {} // MODIFIED');
      expect(fs.readFile(_('/node_modules/test/a/esm5.js'))).toEqual('export function FooA() {}');
    });

    it('should also copy unmodified files in the program', () => {
      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/a/es2015/foo.js'),
          contents: 'export class FooA {} // MODIFIED'
        },
      ]);
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/a/es2015/foo.js')))
          .toEqual('export class FooA {} // MODIFIED');
      expect(fs.readFile(_('/node_modules/test/a/es2015/foo.js'))).toEqual('export class FooA {}');
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/a/es2015/index.js')))
          .toEqual('export {FooA} from "./foo";');
      expect(fs.readFile(_('/node_modules/test/a/es2015/index.js')))
          .toEqual('export {FooA} from "./foo";');
    });

    it('should update the package.json properties', () => {
      fileWriter.writeBundle(entryPoint, esm5bundle, [
        {
          path: _('/node_modules/test/a/esm5.js'),
          contents: 'export function FooA() {} // MODIFIED'
        },
      ]);
      expect(loadPackageJson(fs, '/node_modules/test/a')).toEqual(jasmine.objectContaining({
        module_ivy_ngcc: '../__ivy_ngcc__/a/esm5.js',
      }));

      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/a/es2015/foo.js'),
          contents: 'export class FooA {} // MODIFIED'
        },
      ]);
      expect(loadPackageJson(fs, '/node_modules/test/a')).toEqual(jasmine.objectContaining({
        module_ivy_ngcc: '../__ivy_ngcc__/a/esm5.js',
        es2015_ivy_ngcc: '../__ivy_ngcc__/a/es2015/index.js',
      }));
    });

    it('should overwrite and backup typings files', () => {
      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/a/index.d.ts'),
          contents: 'export declare class FooA {} // MODIFIED'
        },
      ]);
      expect(fs.readFile(_('/node_modules/test/a/index.d.ts')))
          .toEqual('export declare class FooA {} // MODIFIED');
      expect(fs.readFile(_('/node_modules/test/a/index.d.ts.__ivy_ngcc_bak')))
          .toEqual('export declare class FooA {}');
      expect(fs.exists(_('/node_modules/test/__ivy_ngcc__/a/index.d.ts'))).toBe(false);
    });
  });

  describe('writeBundle() [entry-point (with files placed outside entry-point folder)]', () => {
    beforeEach(() => {
      fs = createMockFileSystem();
      fileWriter = new NewEntryPointFileWriter(fs);
      entryPoint = getEntryPointInfo(
          fs, new MockLogger(), _('/node_modules/test'), _('/node_modules/test/b')) !;
      esm5bundle = makeTestBundle(fs, entryPoint, 'module', 'esm5');
      esm2015bundle = makeTestBundle(fs, entryPoint, 'es2015', 'esm2015');
    });

    it('should write the modified file to a new folder', () => {
      fileWriter.writeBundle(entryPoint, esm5bundle, [
        {
          path: _('/node_modules/test/lib/esm5.js'),
          contents: 'export function FooB() {} // MODIFIED'
        },
      ]);
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/lib/esm5.js')))
          .toEqual('export function FooB() {} // MODIFIED');
      expect(fs.readFile(_('/node_modules/test/lib/esm5.js'))).toEqual('export function FooB() {}');
    });

    it('should also copy unmodified files in the program', () => {
      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/lib/es2015/foo.js'),
          contents: 'export class FooB {} // MODIFIED'
        },
      ]);
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/lib/es2015/foo.js')))
          .toEqual('export class FooB {} // MODIFIED');
      expect(fs.readFile(_('/node_modules/test/lib/es2015/foo.js')))
          .toEqual('import {FooA} from "test/a"; import "events"; export class FooB {}');
      expect(fs.readFile(_('/node_modules/test/__ivy_ngcc__/lib/es2015/index.js')))
          .toEqual('export {FooB} from "./foo"; import * from "other";');
      expect(fs.readFile(_('/node_modules/test/lib/es2015/index.js')))
          .toEqual('export {FooB} from "./foo"; import * from "other";');
    });

    it('should not copy typings files within the package (i.e. from a different entry-point)',
       () => {
         fileWriter.writeBundle(entryPoint, esm2015bundle, [
           {
             path: _('/node_modules/test/lib/es2015/foo.js'),
             contents: 'export class FooB {} // MODIFIED'
           },
         ]);
         expect(fs.exists(_('/node_modules/test/__ivy_ngcc__/a/index.d.ts'))).toEqual(false);
       });

    it('should not copy files outside of the package', () => {
      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/lib/es2015/foo.js'),
          contents: 'export class FooB {} // MODIFIED'
        },
      ]);
      expect(fs.exists(_('/node_modules/test/other/index.d.ts'))).toEqual(false);
      expect(fs.exists(_('/node_modules/test/events/events.js'))).toEqual(false);
    });

    it('should update the package.json properties', () => {
      fileWriter.writeBundle(entryPoint, esm5bundle, [
        {
          path: _('/node_modules/test/lib/esm5.js'),
          contents: 'export function FooB() {} // MODIFIED'
        },
      ]);
      expect(loadPackageJson(fs, '/node_modules/test/b')).toEqual(jasmine.objectContaining({
        module_ivy_ngcc: '../__ivy_ngcc__/lib/esm5.js',
      }));

      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/lib/es2015/foo.js'),
          contents: 'export class FooB {} // MODIFIED'
        },
      ]);
      expect(loadPackageJson(fs, '/node_modules/test/b')).toEqual(jasmine.objectContaining({
        module_ivy_ngcc: '../__ivy_ngcc__/lib/esm5.js',
        es2015_ivy_ngcc: '../__ivy_ngcc__/lib/es2015/index.js',
      }));
    });

    it('should overwrite and backup typings files', () => {
      fileWriter.writeBundle(entryPoint, esm2015bundle, [
        {
          path: _('/node_modules/test/typings/index.d.ts'),
          contents: 'export declare class FooB {} // MODIFIED'
        },
      ]);
      expect(fs.readFile(_('/node_modules/test/typings/index.d.ts')))
          .toEqual('export declare class FooB {} // MODIFIED');
      expect(fs.readFile(_('/node_modules/test/typings/index.d.ts.__ivy_ngcc_bak')))
          .toEqual('export declare class FooB {}');
      expect(fs.exists(_('/node_modules/test/__ivy_ngcc__/typings/index.d.ts'))).toBe(false);
    });
  });
});

function makeTestBundle(
    fs: FileSystem, entryPoint: EntryPoint, formatProperty: EntryPointJsonProperty,
    format: EntryPointFormat): EntryPointBundle {
  return makeEntryPointBundle(
      fs, entryPoint.path, entryPoint.packageJson[formatProperty] !, entryPoint.typings, false,
      formatProperty, format, true) !;
}
