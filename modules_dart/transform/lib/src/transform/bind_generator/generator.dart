library angular2.transform.bind_generator.generator;

import 'dart:async';

import 'package:analyzer/analyzer.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/ng_deps.dart';
import 'package:angular2/src/transform/common/property_utils.dart' as prop;
import 'package:barback/barback.dart';

class _ExtractQueryFieldsFromAnnotation extends Object
    with RecursiveAstVisitor<Object> {
  final ConstantEvaluator _evaluator = new ConstantEvaluator();
  final List<String> queryFields = [];

  @override
  Object visitNamedExpression(NamedExpression node) {
    if ('${node.name.label}' == "queries") {
      if (node.expression is! MapLiteral) {
        throw new FormatException(
            'Expected a map value for "queries", but got  ${node.expression}',
            node.toSource());
      }
      MapLiteral queries = node.expression;
      queryFields.addAll(queries.entries.map((e) => e.key.accept(_evaluator)));
    }
    return super.visitNamedExpression(node);
  }

  Map asMap() {
    return new Map.fromIterable(queryFields, value: (_) => 'Object');
  }
}

class _ExtractQueryFieldsFromPropMetadata extends Object
    with RecursiveAstVisitor<Object> {
  final ConstantEvaluator _evaluator = new ConstantEvaluator();
  final List<String> queryFields = [];

  @override
  Object visitMapLiteralEntry(MapLiteralEntry node) {
    if (_hasQueryAnnotation(node.value)) {
      queryFields.add(node.key.accept(_evaluator));
    }
    return super.visitMapLiteralEntry(node);
  }

  bool _hasQueryAnnotation(list) {
    var res = false;
    list.elements.forEach((item) {
      if (item is! InstanceCreationExpression) return;
      var n = item.constructorName.toString();
      if (n == "ContentChild" ||
          n == "ViewChild" ||
          n == "ContentChildren" ||
          n == "ViewChildren") {
        res = true;
      }
    });

    return res;
  }

  asMap() {
    return new Map.fromIterable(queryFields, value: (_) => 'Object');
  }
}

Future<String> createNgSettersAndGetters(
    AssetReader reader, AssetId entryPoint) async {
  NgDeps ngDeps = await NgDeps.parse(reader, entryPoint);

  String code = ngDeps.code;
  var setters = [];

  ngDeps.registeredTypes.forEach((t) {
    final fromAnnotation = new _ExtractQueryFieldsFromAnnotation();
    t.annotations.accept(fromAnnotation);

    final fromPropMetadata = new _ExtractQueryFieldsFromPropMetadata();
    if (t.propMetadata != null) {
      t.propMetadata.accept(fromPropMetadata);
    }
    setters.addAll(_generateSetters(fromAnnotation.asMap()));
    setters.addAll(_generateSetters(fromPropMetadata.asMap()));
  });

  if (setters.isEmpty) return code;
  var out = new StringBuffer();
  var codeInjectIdx = ngDeps.registeredTypes.last.registerMethod.end;
  out.write(code.substring(0, codeInjectIdx));
  if (setters.isNotEmpty) {
    out.write('..registerSetters({${setters.join(', ')}})');
  }
  out.write(code.substring(codeInjectIdx));
  return '$out';
}

// TODO(kegluneq): De-dupe from template_compiler/generator.dart, #3589.

/// Consumes the map generated by {@link _createInputPropertiesMap} to codegen
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
