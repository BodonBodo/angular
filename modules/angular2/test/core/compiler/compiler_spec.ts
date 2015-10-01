import {
  ddescribe,
  describe,
  xdescribe,
  it,
  iit,
  xit,
  expect,
  beforeEach,
  afterEach,
  AsyncTestCompleter,
  inject,
  beforeEachBindings
} from 'angular2/test_lib';

import {Component, View, bind} from 'angular2/core';
import {SpyProtoViewFactory} from '../spies';
import {
  CompiledHostTemplate,
  CompiledTemplate,
  BeginComponentCmd
} from 'angular2/src/core/compiler/template_commands';
import {Compiler} from 'angular2/src/core/compiler/compiler';
import {ProtoViewFactory} from 'angular2/src/core/compiler/proto_view_factory';
import {reflector, ReflectionInfo} from 'angular2/src/core/reflection/reflection';
import {AppProtoView} from 'angular2/src/core/compiler/view';

export function main() {
  describe('Compiler', () => {
    var compiler: Compiler;
    var protoViewFactorySpy;
    var someProtoView;
    var cht: CompiledHostTemplate;

    beforeEachBindings(() => {
      protoViewFactorySpy = new SpyProtoViewFactory();
      someProtoView = new AppProtoView(null, null, null, null, null, null);
      protoViewFactorySpy.spy('createHost').andReturn(someProtoView);
      return [bind(ProtoViewFactory).toValue(protoViewFactorySpy), Compiler];
    });

    beforeEach(inject([Compiler], (_compiler) => {
      compiler = _compiler;
      cht = new CompiledHostTemplate(() => new CompiledTemplate(23, null));
      reflector.registerType(SomeComponent, new ReflectionInfo([cht]));
    }));

    it('should read the template from an annotation', inject([AsyncTestCompleter], (async) => {
         compiler.compileInHost(SomeComponent)
             .then((_) => {
               expect(protoViewFactorySpy.spy('createHost')).toHaveBeenCalledWith(cht);
               async.done();
             });
       }));

    it('should clear the cache', () => {
      compiler.clearCache();
      expect(protoViewFactorySpy.spy('clearCache')).toHaveBeenCalled();
    });
  });
}

class SomeComponent {}
