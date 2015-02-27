library angular2.src.transform.directive_processor.transformer;

import 'dart:async';

import 'package:angular2/src/transform/common/formatter.dart';
import 'package:angular2/src/transform/common/logging.dart' as log;
import 'package:angular2/src/transform/common/names.dart';
import 'package:angular2/src/transform/common/options.dart';
import 'package:barback/barback.dart';

import 'rewriter.dart';

/// Transformer responsible for processing all .dart assets and creating
/// .ngDeps.dart files which register @Injectable annotated classes with the
/// reflector.
///
/// This will also create .ngDeps.dart files for classes annotated
/// with @Component, @Template, @Decorator, etc.
///
/// This transformer is the first phase in a two-phase transform. It should
/// be followed by [DirectiveLinker].
class DirectiveProcessor extends Transformer {
  final TransformerOptions options;

  DirectiveProcessor(this.options);

  @override
  bool isPrimary(AssetId id) => id.extension.endsWith('dart');

  @override
  Future apply(Transform transform) async {
    log.init(transform);

    try {
      var assetCode = await transform.primaryInput.readAsString();
      var ngDepsSrc = createNgDeps(assetCode, transform.primaryInput.id.path,
          forceGenerate: transform.primaryInput.id.path == options.entryPoint);
      if (ngDepsSrc != null && ngDepsSrc.isNotEmpty) {
        var ngDepsAssetId =
            transform.primaryInput.id.changeExtension(DEPS_EXTENSION);
        var exists = await transform.hasInput(ngDepsAssetId);
        if (exists) {
          log.logger.error('Clobbering ${ngDepsAssetId}. '
              'This probably will not end well');
        }
        transform.addOutput(new Asset.fromString(ngDepsAssetId, ngDepsSrc));
      }
    } catch (ex, stackTrace) {
      log.logger.warning('Processing ng directives failed.\n'
          'Exception: $ex\n'
          'Stack Trace: $stackTrace');
    }
  }
}
