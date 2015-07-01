library angular2.transform.bind_generator.generator;

import 'dart:async';

import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/ng_deps.dart';
import 'package:angular2/src/transform/common/property_utils.dart' as prop;
import 'package:barback/barback.dart';

import 'visitor.dart';

Future<String> createNgSettersAndGetters(
    AssetReader reader, AssetId entryPoint) async {
  NgDeps ngDeps = await NgDeps.parse(reader, entryPoint);

  String code = ngDeps.code;
  var setters = _generateSetters(_createPropertiesMap(ngDeps));
  var getters = _generateGetters(_createEventsMap(ngDeps));

  if (setters.isEmpty && getters.isEmpty) return code;
  var out = new StringBuffer();
  var codeInjectIdx = ngDeps.registeredTypes.last.registerMethod.end;
  out.write(code.substring(0, codeInjectIdx));
  if (setters.isNotEmpty) {
    out.write('..registerSetters({${setters.join(', ')}})');
  }
  if (getters.isNotEmpty) {
    out.write('..registerGetters({${getters.join(', ')}})');
  }
  out.write(code.substring(codeInjectIdx));
  return '$out';
}

// TODO(kegluneq): De-dupe from template_compiler/generator.dart.

/// Consumes the map generated by {@link _createPropertiesMap} to codegen
/// setters.
List<String> _generateSetters(Map<String, String> bindMap) {
  var setters = [];
  // TODO(kegluneq): Include types for receivers. See #886.
  bindMap.forEach((setterName, type) {
    if (!prop.isValid(setterName)) {
      // TODO(kegluenq): Eagerly throw here once #1295 is addressed.
      setters.add(prop.lazyInvalidSetter(setterName));
    } else {
      setters.add(''' '${prop.sanitize(setterName)}': '''
          ''' (o, v) => o.$setterName = v ''');
    }
  });
  return setters;
}

/// Collapses all `properties` in {@link ngDeps} into a map where the keys are
/// the bind properties and the values are either the one and only type
/// binding to that property or the empty string.
Map<String, String> _createPropertiesMap(NgDeps ngDeps) {
  var visitor = new ExtractNamedExpressionVisitor('properties');
  var bindMap = {};
  ngDeps.registeredTypes.forEach((RegisteredType t) {
    visitor.bindConfig.clear();
    t.annotations.accept(visitor);
    visitor.bindConfig.forEach((String config) {
      // See comments for `Directive` in annotations_impl/annotations.ts for
      // details on how `properties` is specified.
      var prop;
      var idx = config.indexOf(':');
      if (idx > 0) {
        prop = config.substring(0, idx).trim();
      } else {
        prop = config;
      }
      if (bindMap.containsKey(prop)) {
        bindMap[prop] = '';
      } else {
        bindMap[prop] = '${t.typeName}';
      }
    });
  });
  return bindMap;
}

/// Consumes the map generated by {@link _createEventsMap} to codegen getters.
List<String> _generateGetters(Map<String, String> bindMap) {
  var getters = [];
  // TODO(kegluneq): Include types for receivers. See #886.
  bindMap.forEach((getterName, eventName) {
    if (!prop.isValid(eventName)) {
      // TODO(kegluenq): Eagerly throw here once #1295 is addressed.
      getters.add(prop.lazyInvalidGetter(eventName));
    } else {
      getters.add(''' '${prop.sanitize(eventName)}': (o) => o.$getterName''');
    }
  });
  return getters;
}

/// Collapses all `events` in {@link ngDeps} into a map where the keys are
/// the property names for the event emitters and the values are the event name.
Map<String, String> _createEventsMap(NgDeps ngDeps) {
  var visitor = new ExtractNamedExpressionVisitor('events');
  var bindMap = {};
  ngDeps.registeredTypes.forEach((RegisteredType t) {
    visitor.bindConfig.clear();
    t.annotations.accept(visitor);
    visitor.bindConfig.forEach((String config) {
      // See comments for `Directive` in annotations_impl/annotations.ts for
      // details on how `events` is specified.
      var parts = config.split(':').map((p) => p.trim()).toList();
      bindMap[parts[0]] = parts.length > 1 ? parts[1] : parts[0];
    });
  });
  return bindMap;
}
