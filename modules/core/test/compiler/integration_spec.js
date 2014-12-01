import {describe, xit, it, expect, beforeEach, ddescribe, iit} from 'test_lib/test_lib';

import {DOM} from 'facade/dom';

import {Injector} from 'di/di';
import {ChangeDetector} from 'change_detection/change_detector';
import {Parser} from 'change_detection/parser/parser';
import {Lexer} from 'change_detection/parser/lexer';

import {Compiler} from 'core/compiler/compiler';
import {DirectiveMetadataReader} from 'core/compiler/directive_metadata_reader';

import {Decorator, Component, Template} from 'core/annotations/annotations';
import {TemplateConfig} from 'core/annotations/template_config';

import {ViewPort} from 'core/compiler/viewport';

export function main() {
  describe('integration tests', function() {
    var compiler;

    beforeEach( () => {
      compiler = new Compiler(null, new DirectiveMetadataReader(), new Parser(new Lexer()));
    });

    describe('react to record changes', function() {
      var view, ctx, cd;
      function createView(pv) {
        ctx = new MyComp();
        view = pv.instantiate(ctx, new Injector([]), null);
        cd = new ChangeDetector(view.recordRange);
      }

      it('should consume text node changes', (done) => {
        compiler.compile(MyComp, createElement('<div>{{ctxProp}}</div>')).then((pv) => {
          createView(pv);
          ctx.ctxProp = 'Hello World!';

          cd.detectChanges();
          expect(DOM.getInnerHTML(view.nodes[0])).toEqual('Hello World!');
          done();
        });
      });

      it('should consume element binding changes', (done) => {
        compiler.compile(MyComp, createElement('<div [id]="ctxProp"></div>')).then((pv) => {
          createView(pv);

          ctx.ctxProp = 'Hello World!';
          cd.detectChanges();

          expect(view.nodes[0].id).toEqual('Hello World!');
          done();
        });
      });

      it('should consume directive watch expression change.', (done) => {
        compiler.compile(MyComp, createElement('<div my-dir [elprop]="ctxProp"></div>')).then((pv) => {
          createView(pv);

          ctx.ctxProp = 'Hello World!';
          cd.detectChanges();

          var elInj = view.elementInjectors[0];
          expect(elInj.get(MyDir).dirProp).toEqual('Hello World!');
          done();
        });
      });

      it('should support nested components.', (done) => {
        compiler.compile(MyComp, createElement('<child-cmp></child-cmp>')).then((pv) => {
          createView(pv);

          cd.detectChanges();

          expect(view.nodes[0].shadowRoot.childNodes[0].nodeValue).toEqual('hello');
          done();
        });
      });

      it('should support template directives via `<template>` elements.', (done) => {
        compiler.compile(MyComp, createElement('<div><template some-tmpl><copy-me>hello</copy-me></template></div>')).then((pv) => {
          createView(pv);

          cd.detectChanges();

          var childNodesOfWrapper = view.nodes[0].childNodes;
          // 1 template + 2 copies.
          expect(childNodesOfWrapper.length).toBe(3);
          expect(childNodesOfWrapper[1].childNodes[0].nodeValue).toEqual('hello');
          expect(childNodesOfWrapper[2].childNodes[0].nodeValue).toEqual('hello');
          done();
        });
      });

      it('should support template directives via `template` attribute.', (done) => {
        compiler.compile(MyComp, createElement('<div><copy-me template="some-tmpl">hello</copy-me></div>')).then((pv) => {
          createView(pv);

          cd.detectChanges();

          var childNodesOfWrapper = view.nodes[0].childNodes;
          // 1 template + 2 copies.
          expect(childNodesOfWrapper.length).toBe(3);
          expect(childNodesOfWrapper[1].childNodes[0].nodeValue).toEqual('hello');
          expect(childNodesOfWrapper[2].childNodes[0].nodeValue).toEqual('hello');
          done();
        });
      });
    });
  });
}

@Decorator({
  selector: '[my-dir]',
  bind: {'elprop':'dirProp'}
})
class MyDir {
  dirProp:string;
  constructor() {
    this.dirProp = '';
  }
}

@Component({
  template: new TemplateConfig({
    directives: [MyDir, ChildComp, SomeTemplate]
  })
})
class MyComp {
  ctxProp:string;
  constructor() {
    this.ctxProp = 'initial value';
  }
}

@Component({
  selector: 'child-cmp',
  componentServices: [MyService],
  template: new TemplateConfig({
    directives: [MyDir],
    inline: '{{ctxProp}}'
  })
})
class ChildComp {
  ctxProp:string;
  constructor(service: MyService) {
    this.ctxProp = service.greeting;
  }
}

@Template({
  selector: '[some-tmpl]'
})
class SomeTemplate {
  constructor(viewPort: ViewPort) {
    viewPort.create();
    viewPort.create();
  }
}

class MyService {
  greeting:string;
  constructor() {
    this.greeting = 'hello';
  }
}


function createElement(html) {
  return DOM.createTemplate(html).content.firstChild;
}
