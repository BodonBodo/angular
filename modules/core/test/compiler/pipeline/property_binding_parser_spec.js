import {describe, beforeEach, it, expect, iit, ddescribe, el} from 'test_lib/test_lib';
import {PropertyBindingParser} from 'core/src/compiler/pipeline/property_binding_parser';
import {CompilePipeline} from 'core/src/compiler/pipeline/compile_pipeline';
import {DOM} from 'facade/src/dom';
import {MapWrapper} from 'facade/src/collection';

import {Lexer, Parser} from 'change_detection/change_detection';

export function main() {
  describe('PropertyBindingParser', () => {
    function createPipeline() {
      return new CompilePipeline([new PropertyBindingParser(new Parser(new Lexer()), null)]);
    }

    it('should detect [] syntax', () => {
      var results = createPipeline().process(el('<div [a]="b"></div>'));
      expect(MapWrapper.get(results[0].propertyBindings, 'a').source).toEqual('b');
    });

    it('should detect bind- syntax', () => {
      var results = createPipeline().process(el('<div bind-a="b"></div>'));
      expect(MapWrapper.get(results[0].propertyBindings, 'a').source).toEqual('b');
    });

    it('should detect interpolation syntax', () => {
      // Note: we don't test all corner cases of interpolation as we assume shared functionality between text interpolation
      // and attribute interpolation.
      var results = createPipeline().process(el('<div a="{{b}}"></div>'));
      expect(MapWrapper.get(results[0].propertyBindings, 'a').source).toEqual('{{b}}');
    });

    it('should detect var- syntax', () => {
      var results = createPipeline().process(el('<template var-a="b"></template>'));
      expect(MapWrapper.get(results[0].variableBindings, 'b')).toEqual('a');
    });

    it('should not allow var- syntax on non template elements', () => {
      expect( () => {
        createPipeline().process(el('<div var-a="b"></div>'))
      }).toThrowError('var-* is only allowed on <template> elements!');
    });

    it('should detect () syntax', () => {
      var results = createPipeline().process(el('<div (click)="b()"></div>'));
      expect(MapWrapper.get(results[0].eventBindings, 'click').source).toEqual('b()');
      // "(click[])" is not an expected syntax and is only used to validate the regexp
      results = createPipeline().process(el('<div (click[])="b()"></div>'));
      expect(MapWrapper.get(results[0].eventBindings, 'click[]').source).toEqual('b()');

    });

    it('should detect on- syntax', () => {
      var results = createPipeline().process(el('<div on-click="b()"></div>'));
      expect(MapWrapper.get(results[0].eventBindings, 'click').source).toEqual('b()');
    });
  });
}
