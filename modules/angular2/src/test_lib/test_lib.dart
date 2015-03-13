library test_lib.test_lib;

import 'package:guinness/guinness.dart' as gns;
export 'package:guinness/guinness.dart' hide Expect, expect, NotExpect, beforeEach, it, iit, xit;
import 'package:unittest/unittest.dart' hide expect;
import 'dart:mirrors';
import 'dart:async';

import 'package:collection/equality.dart';
import 'package:angular2/src/dom/dom_adapter.dart' show DOM;

import 'package:angular2/src/reflection/reflection.dart';
import 'package:angular2/src/reflection/reflection_capabilities.dart';

import 'package:angular2/src/di/binding.dart' show bind;
import 'package:angular2/src/di/injector.dart' show Injector;

import './test_injector.dart';
export './test_injector.dart' show inject;

bool IS_DARTIUM = true;
bool IS_NODEJS = false;

List _testBindings = [];
Injector _injector;
bool _isCurrentTestAsync;
bool _inIt = false;

class AsyncTestCompleter {
  Completer _completer;

  AsyncTestCompleter() {
    _completer = new Completer();
  }

  done() {
    _completer.complete();
  }

  get future => _completer.future;
}

testSetup() {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
  // beforeEach configuration:
  // - Priority 3: clear the bindings before each test,
  // - Priority 2: collect the bindings before each test, see beforeEachBindings(),
  // - Priority 1: create the test injector to be used in beforeEach() and it()

  gns.beforeEach(
      () {
        _testBindings.clear();
      },
      priority: 3
  );

  var completerBinding = bind(AsyncTestCompleter).toFactory(() {
    // Mark the test as async when an AsyncTestCompleter is injected in an it(),
    if (!_inIt) throw 'AsyncTestCompleter can only be injected in an "it()"';
    _isCurrentTestAsync = true;
    return new AsyncTestCompleter();
  });

  gns.beforeEach(
      () {
        _isCurrentTestAsync = false;
        _testBindings.add(completerBinding);
        _injector = createTestInjector(_testBindings);
      },
      priority: 1
  );
}

Expect expect(actual, [matcher]) {
  final expect = new Expect(actual);
  if (matcher != null) expect.to(matcher);
  return expect;
}

class Expect extends gns.Expect {
  Expect(actual) : super(actual);

  NotExpect get not => new NotExpect(actual);

  // TODO(tbosch) change back when https://github.com/vsavkin/guinness/issues/41 is fixed
  // void toEqual(expected) => toHaveSameProps(expected);
  void toEqual(expected) => _expect(actual, new FixedSamePropsMatcher(expected));
  void toThrowError([message=""]) => this.toThrowWith(message: message);
  void toBePromise() => _expect(actual is Future, equals(true));
  void toImplement(expected) => toBeA(expected);
  void toBeNaN() => _expect(double.NAN.compareTo(actual) == 0, equals(true));
  void toHaveText(expected) => _expect(elementText(actual), expected);
  Function get _expect => gns.guinness.matchers.expect;
}

class NotExpect extends gns.NotExpect {
  NotExpect(actual) : super(actual);

  // TODO(tbosch) change back when https://github.com/vsavkin/guinness/issues/41 is fixed
  // void toEqual(expected) => toHaveSameProps(expected);
  void toEqual(expected) => _expect(actual, isNot(new FixedSamePropsMatcher(expected)));
  void toBePromise() => _expect(actual is Future, equals(false));
  Function get _expect => gns.guinness.matchers.expect;
}

beforeEach(fn) {
  if (fn is! FunctionWithParamTokens) fn = new FunctionWithParamTokens([], fn);
  gns.beforeEach(() {
    fn.execute(_injector);
  });
}

/**
 * Allows overriding default bindings defined in test_injector.js.
 *
 * The given function must return a list of DI bindings.
 *
 * Example:
 *
 *   beforeEachBindings(() => [
 *     bind(Compiler).toClass(MockCompiler),
 *     bind(SomeToken).toValue(myValue),
 *   ]);
 */
beforeEachBindings(fn) {
  gns.beforeEach(
      () {
        var bindings = fn();
        if (bindings != null) _testBindings.addAll(bindings);
      },
      priority: 2
  );
}

_it(gnsFn, name, fn) {
  if (fn is! FunctionWithParamTokens) fn = new FunctionWithParamTokens([], fn);
  gnsFn(name, () {
    _inIt = true;
    fn.execute(_injector);
    _inIt = false;
    if (_isCurrentTestAsync) return _injector.get(AsyncTestCompleter).future;
  });
}


it(name, fn) {
  _it(gns.it, name, fn);
}

iit(name, fn) {
  _it(gns.iit, name, fn);
}

xit(name, fn) {
  _it(gns.xit, name, fn);
}

// TODO(tbosch): remove when https://github.com/vsavkin/guinness/issues/41
// is fixed
class FixedSamePropsMatcher extends Matcher {
  final Object _expected;

  const FixedSamePropsMatcher(this._expected);

  bool matches(actual, Map matchState) {
    return compare(toData(_expected), toData(actual));
  }

  Description describeMismatch(item, Description mismatchDescription,
      Map matchState, bool verbose) =>
      mismatchDescription.add('is equal to ${toData(item)}. Expected: ${toData(_expected)}');

  Description describe(Description description) =>
      description.add('has different properties');

  toData(obj) => new _FixedObjToData().call(obj);
  compare(d1, d2) => new DeepCollectionEquality().equals(d1, d2);
}

// TODO(tbosch): remove when https://github.com/vsavkin/guinness/issues/41
// is fixed
class _FixedObjToData {
  final visitedObjects = new Set();

  call(obj) {
    if (visitedObjects.contains(obj)) return null;
    visitedObjects.add(obj);

    if (obj is num || obj is String || obj is bool) return obj;
    if (obj is Iterable) return obj.map(call).toList();
    if (obj is Map) return mapToData(obj);
    return toDataUsingReflection(obj);
  }

  mapToData(obj) {
    var res = {};
    obj.forEach((k,v) {
      res[call(k)] = call(v);
    });
    return res;
  }

  toDataUsingReflection(obj) {
    final clazz = reflectClass(obj.runtimeType);
    final instance = reflect(obj);

    return clazz.declarations.values.fold({}, (map, decl) {
      if (decl is VariableMirror && !decl.isPrivate && !decl.isStatic) {
        final field = instance.getField(decl.simpleName);
        final name = MirrorSystem.getName(decl.simpleName);
        map[name] = call(field.reflectee);
      }
      return map;
    });
  }
}

String elementText(n) {
  hasNodes(n) {
    var children = DOM.childNodes(n);
    return children != null && children.length > 0;
  }

  if (n is Iterable) {
    return n.map((nn) => elementText(nn)).join("");
  }

  if (DOM.isCommentNode(n)) {
    return '';
  }

  if (DOM.isElementNode(n) && DOM.tagName(n) == 'CONTENT') {
    return elementText(n.getDistributedNodes());
  }

  if (DOM.hasShadowRoot(n)) {
    return elementText(DOM.childNodesAsList(n.shadowRoot));
  }

  if (hasNodes(n)) {
    return elementText(DOM.childNodesAsList(n));
  }

  return DOM.getText(n);
}
