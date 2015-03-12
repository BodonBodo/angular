library angular2.src.transform.bind_generator.generator;

import 'dart:async';

import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/parser.dart';
import 'package:barback/barback.dart';

import 'visitor.dart';

Future<String> createNgSetters(AssetReader reader, AssetId entryPoint) async {
  var parser = new Parser(reader);
  NgDeps ngDeps = await parser.parse(entryPoint);

  String code = ngDeps.code;
  var setters = _generateSetters(_createBindMap(ngDeps));

  if (setters.length == 0) return code;
  var codeInjectIdx = ngDeps.registeredTypes.last.registerMethod.end;
  return '${code.substring(0, codeInjectIdx)}'
      '..registerSetters({${setters.join(', ')}})'
      '${code.substring(codeInjectIdx)}';
}

/// Consumes the map generated by [_createBindMap] to codegen setters.
List<String> _generateSetters(Map<String, String> bindMap) {
  var setters = [];
  // TODO(kegluneq): Include types for receivers. See #886.
  bindMap.forEach((prop, type) {
    setters.add('\'$prop\': (o, String v) => o.$prop = v');
  });
  return setters;
}

/// Collapses all `bindProperties` in [ngDeps] into a map where the keys are
/// the bind properties and the values are either the one and only type
/// binding to that property or the empty string.
Map<String, String> _createBindMap(NgDeps ngDeps) {
  var visitor = new ExtractSettersVisitor();
  var bindMap = {};
  ngDeps.registeredTypes.forEach((RegisteredType t) {
    visitor.bindMappings.clear();
    t.annotations.accept(visitor);
    visitor.bindMappings.forEach((String prop, _) {
      if (bindMap.containsKey(prop)) {
        bindMap[prop] = '';
      } else {
        bindMap[prop] = '${t.typeName}';
      }
    });
  });
  return bindMap;
}
