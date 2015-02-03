import {DOM, document} from 'facade/src/dom';
import {isBlank, Type} from 'facade/src/lang';
import {MapWrapper} from 'facade/src/collection';
import {DirectiveMetadata} from 'core/src/compiler/directive_metadata';

import {Parser, Lexer, ProtoRecordRange, dynamicChangeDetection} from 'change_detection/change_detection';

import {Compiler, CompilerCache} from 'core/src/compiler/compiler';
import {DirectiveMetadataReader} from 'core/src/compiler/directive_metadata_reader';

import {Component} from 'core/src/annotations/annotations';
import {Decorator} from 'core/src/annotations/annotations';
import {TemplateConfig} from 'core/src/annotations/template_config';

import {reflector} from 'reflection/src/reflection';
import {getIntParameter, bindAction} from 'e2e_test_lib/src/benchmark_util';

function setupReflector() {
  reflector.registerType(BenchmarkComponent, {
    "factory": () => new BenchmarkComponent(),
    "parameters": [],
    "annotations" : [new Component({template: new TemplateConfig({directives: [Dir0, Dir1, Dir2, Dir3, Dir4]})})]
  });

  reflector.registerType(Dir0, {
    "factory": () => new Dir0(),
    "parameters": [],
    "annotations" : [new Decorator({selector: '[dir0]', bind: {'attr0': 'prop'}})]
  });

  reflector.registerType(Dir1, {
    "factory": (dir0) => new Dir1(dir0),
    "parameters": [[Dir0]],
    "annotations" : [new Decorator({selector: '[dir1]', bind: {'attr1': 'prop'}})]
  });

  reflector.registerType(Dir2, {
    "factory": (dir1) => new Dir2(dir1),
    "parameters": [[Dir1]],
    "annotations" : [new Decorator({selector: '[dir2]', bind: {'attr2': 'prop'}})]
  });

  reflector.registerType(Dir3, {
    "factory": (dir2) => new Dir3(dir2),
    "parameters": [[Dir2]],
    "annotations" : [new Decorator({selector: '[dir3]', bind: {'attr3': 'prop'}})]
  });

  reflector.registerType(Dir4, {
    "factory": (dir3) => new Dir4(dir3),
    "parameters": [[Dir3]],
    "annotations" : [new Decorator({selector: '[dir4]', bind: {'attr4': 'prop'}})]
  });

  reflector.registerGetters({
    "inter0": (a) => a.inter0, "inter1": (a) => a.inter1,
    "inter2": (a) => a.inter2, "inter3": (a) => a.inter3, "inter4": (a) => a.inter4,

    "value0": (a) => a.value0, "value1": (a) => a.value1,
    "value2": (a) => a.value2, "value3": (a) => a.value3, "value4": (a) => a.value4,

    "prop" : (a) => a.prop
  });

  reflector.registerSetters({
    "inter0": (a,v) => a.inter0 = v, "inter1": (a,v) => a.inter1 = v,
    "inter2": (a,v) => a.inter2 = v, "inter3": (a,v) => a.inter3 = v, "inter4": (a,v) => a.inter4 = v,

    "value0": (a,v) => a.value0 = v, "value1": (a,v) => a.value1 = v,
    "value2": (a,v) => a.value2 = v, "value3": (a,v) => a.value3 = v, "value4": (a,v) => a.value4 = v,

    "prop": (a,v) => a.prop = v
  });
}

export function main() {
  var count = getIntParameter('elements');

  setupReflector();
  var reader = new DirectiveMetadataReader();
  var cache = new CompilerCache();
  var compiler = new Compiler(dynamicChangeDetection, null, reader, new Parser(new Lexer()), cache);
  var annotatedComponent = reader.read(BenchmarkComponent);

  var templateNoBindings = loadTemplate('templateNoBindings', count);
  var templateWithBindings = loadTemplate('templateWithBindings', count);

  function compileNoBindings() {
    // Need to clone every time as the compiler might modify the template!
    var cloned = DOM.clone(templateNoBindings);
    cache.clear();
    compiler.compileAllLoaded(null, annotatedComponent, cloned);
  }

  function compileWithBindings() {
    // Need to clone every time as the compiler might modify the template!
    var cloned = DOM.clone(templateWithBindings);
    cache.clear();
    compiler.compileAllLoaded(null, annotatedComponent, cloned);
  }

  bindAction('#compileNoBindings', compileNoBindings);
  bindAction('#compileWithBindings', compileWithBindings);
}

function loadTemplate(templateId, repeatCount) {
  var template = DOM.querySelectorAll(document, `#${templateId}`)[0];
  var content = DOM.getInnerHTML(template);
  var result = '';
  for (var i=0; i<repeatCount; i++) {
    result += content;
  }
  return DOM.createTemplate(result);
}

@Decorator({
  selector: '[dir0]',
  bind: {
    'attr0': 'prop'
  }
})
class Dir0 {}

@Decorator({
  selector: '[dir1]',
  bind: {
    'attr1': 'prop'
  }
})
class Dir1 {
  constructor(dir0:Dir0) {}
}

@Decorator({
  selector: '[dir2]',
  bind: {
    'attr2': 'prop'
  }
})
class Dir2 {
  constructor(dir1:Dir1) {}
}

@Decorator({
  selector: '[dir3]',
  bind: {
    'attr3': 'prop'
  }
})
class Dir3 {
  constructor(dir2:Dir2) {}
}

@Decorator({
  selector: '[dir4]',
  bind: {
    'attr4': 'prop'
  }
})
class Dir4 {
  constructor(dir3:Dir3) {}
}

@Component({
  template: new TemplateConfig({
    directives: [Dir0, Dir1, Dir2, Dir3, Dir4]
  })
})
class BenchmarkComponent {}

