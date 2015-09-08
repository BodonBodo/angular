library angular2.transform.template_compiler.generator;

import 'dart:async';

import 'package:angular2/src/core/change_detection/parser/lexer.dart' as ng;
import 'package:angular2/src/core/change_detection/parser/parser.dart' as ng;
import 'package:angular2/src/core/change_detection/interfaces.dart';
import 'package:angular2/src/core/compiler/proto_view_factory.dart';
import 'package:angular2/src/core/dom/dom_adapter.dart';
import 'package:angular2/src/core/render/api.dart';
import 'package:angular2/src/core/render/dom/compiler/compile_pipeline.dart';
import 'package:angular2/src/core/render/dom/compiler/style_inliner.dart';
import 'package:angular2/src/core/render/dom/compiler/style_url_resolver.dart';
import 'package:angular2/src/core/render/dom/compiler/view_loader.dart';
import 'package:angular2/src/core/render/dom/schema/element_schema_registry.dart';
import 'package:angular2/src/core/render/dom/schema/dom_element_schema_registry.dart';
import 'package:angular2/src/core/render/dom/template_cloner.dart';
import 'package:angular2/src/core/render/xhr.dart' show XHR;
import 'package:angular2/src/core/reflection/reflection.dart';
import 'package:angular2/src/core/services/url_resolver.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/xhr_impl.dart';
import 'package:angular2/src/core/facade/lang.dart';
import 'package:barback/barback.dart';

import 'change_detector_codegen.dart' as change;
import 'compile_step_factory.dart';
import 'reflection/codegen.dart' as reg;
import 'reflection/processor.dart' as reg;
import 'reflection/reflection_capabilities.dart';
import 'view_definition_creator.dart';

/// Reads the `.ng_deps.dart` file represented by `entryPoint` and parses any
/// Angular 2 `View` annotations it declares to generate `getter`s,
/// `setter`s, and `method`s that would otherwise be reflectively accessed.
///
/// This method assumes a {@link DomAdapter} has been registered.
Future<String> processTemplates(AssetReader reader, AssetId entryPoint,
    {bool generateRegistrations: true,
    bool generateChangeDetectors: true, bool reflectPropertiesAsAttributes: false}) async {
  var viewDefResults = await createViewDefinitions(reader, entryPoint);
  // Note: TemplateCloner(-1) never serializes Nodes into strings.
  // we might want to change this to TemplateCloner(0) to force the serialization
  // later when the transformer also stores the proto view template.
  var extractor = new _TemplateExtractor(new DomElementSchemaRegistry(),
      new TemplateCloner(-1), new XhrImpl(reader, entryPoint));

  final processor = new reg.Processor();

  var changeDetectorClasses = new change.Codegen();
  for (var rType in viewDefResults.viewDefinitions.keys) {
    var viewDefEntry = viewDefResults.viewDefinitions[rType];
    var protoView = await extractor.extractTemplates(viewDefEntry.viewDef);
    if (protoView == null) continue;

    if (generateRegistrations) {
      processor.process(viewDefEntry, protoView);
    }
    if (generateChangeDetectors) {
      var saved = reflector.reflectionCapabilities;
      var genConfig = new ChangeDetectorGenConfig(assertionsEnabled(), assertionsEnabled(), reflectPropertiesAsAttributes, false);

      reflector.reflectionCapabilities = const NullReflectionCapabilities();
      var defs = getChangeDetectorDefinitions(viewDefEntry.hostMetadata,
          protoView, viewDefEntry.viewDef.directives, genConfig);
      for (var i = 0; i < defs.length; ++i) {
        changeDetectorClasses.generate('${rType.typeName}',
            '_${rType.typeName}_ChangeDetector$i', defs[i]);
      }
      reflector.reflectionCapabilities = saved;
    }
  }

  // TODO(kegluneq): Do not hard-code `false` here once i/3436 is fixed.
  final registrations = new reg.Codegen(generateChangeDetectors: false);
  registrations.generate(processor);

  var code = viewDefResults.ngDeps.code;
  if (registrations.isEmpty && changeDetectorClasses.isEmpty) return code;
  var importInjectIdx =
      viewDefResults.ngDeps.lib != null ? viewDefResults.ngDeps.lib.end : 0;
  var codeInjectIdx =
      viewDefResults.ngDeps.registeredTypes.last.registerMethod.end;
  var initInjectIdx = viewDefResults.ngDeps.setupMethod.end - 1;
  return '${code.substring(0, importInjectIdx)}'
      '${changeDetectorClasses.imports}'
      '${code.substring(importInjectIdx, codeInjectIdx)}'
      '${registrations}'
      '${code.substring(codeInjectIdx, initInjectIdx)}'
      '${changeDetectorClasses.initialize}'
      '${code.substring(initInjectIdx)}'
      '$changeDetectorClasses';
}

/// Extracts `template` and `url` values from `View` annotations, reads
/// template code if necessary, and determines what values will be
/// reflectively accessed from that template.
class _TemplateExtractor {
  final CompileStepFactory _factory;
  ViewLoader _loader;
  ElementSchemaRegistry _schemaRegistry;
  TemplateCloner _templateCloner;

  _TemplateExtractor(this._schemaRegistry, this._templateCloner, XHR xhr)
      : _factory = new CompileStepFactory(new ng.Parser(new ng.Lexer())) {
    var urlResolver = new UrlResolver();
    var styleUrlResolver = new StyleUrlResolver(urlResolver);
    var styleInliner = new StyleInliner(xhr, styleUrlResolver, urlResolver);

    _loader = new ViewLoader(xhr, styleInliner, styleUrlResolver);
  }

  Future<ProtoViewDto> extractTemplates(ViewDefinition viewDef) async {
    // Check for "imperative views".
    if (viewDef.template == null && viewDef.templateAbsUrl == null) return null;

    var templateAndStyles = await _loader.load(viewDef);

    // NOTE(kegluneq): Since this is a global, we must not have any async
    // operations between saving and restoring it, otherwise we can get into
    // a bad state. See issue #2359 for additional context.
    var savedReflectionCapabilities = reflector.reflectionCapabilities;
    reflector.reflectionCapabilities = const NullReflectionCapabilities();

    var pipeline = new CompilePipeline(_factory.createSteps(viewDef));

    var compileElements = pipeline.processElements(
        DOM.createTemplate(templateAndStyles.template),
        ViewType.COMPONENT,
        viewDef);
    var protoViewDto = compileElements[0]
        .inheritedProtoView
        .build(_schemaRegistry, _templateCloner);

    reflector.reflectionCapabilities = savedReflectionCapabilities;

    return protoViewDto;
  }
}
