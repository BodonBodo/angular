library angular2.transform.common.options;

import 'package:glob/glob.dart';

import 'annotation_matcher.dart';
import 'mirror_mode.dart';

const CUSTOM_ANNOTATIONS_PARAM = 'custom_annotations';
const ENTRY_POINT_PARAM = 'entry_points';
const FORMAT_CODE_PARAM = 'format_code';
// TODO(kegluenq): Remove this after 30 Oct (i/4433).
const GENERATE_CHANGE_DETECTORS_PARAM = 'generate_change_detectors';
const REFLECT_PROPERTIES_AS_ATTRIBUTES = 'reflectPropertiesAsAttributes';
const INIT_REFLECTOR_PARAM = 'init_reflector';
const INLINE_VIEWS_PARAM = 'inline_views';
const MIRROR_MODE_PARAM = 'mirror_mode';
const OPTIMIZATION_PHASES_PARAM = 'optimization_phases';

/// Provides information necessary to transform an Angular2 app.
class TransformerOptions {
  final List<Glob> entryPointGlobs;

  /// The path to the files where the application's calls to `bootstrap` are.
  final List<String> entryPoints;

  /// The `BarbackMode#name` we are running in.
  final String modeName;

  /// The [MirrorMode] to use for the transformation.
  final MirrorMode mirrorMode;

  /// Whether to generate calls to our generated `initReflector` code
  final bool initReflector;

  /// The [AnnotationMatcher] which is used to identify angular annotations.
  final AnnotationMatcher annotationMatcher;

  final bool reflectPropertiesAsAttributes;

  /// Whether to format generated code.
  /// Code that is only modified will never be formatted because doing so may
  /// invalidate the source maps generated by `dart2js` and/or other tools.
  final bool formatCode;

  /// Whether to inline views.
  /// If this is `true`, the transformer will *only* make a single pass over the
  /// input files and inline `templateUrl` and `styleUrls` values.
  /// This is undocumented, for testing purposes only, and may change or break
  /// at any time.
  final bool inlineViews;

  TransformerOptions._internal(
      this.entryPoints,
      this.entryPointGlobs,
      this.modeName,
      this.mirrorMode,
      this.initReflector,
      this.annotationMatcher,
      {this.reflectPropertiesAsAttributes,
      this.inlineViews,
      this.formatCode});

  factory TransformerOptions(List<String> entryPoints,
      {String modeName: 'release',
      MirrorMode mirrorMode: MirrorMode.none,
      bool initReflector: true,
      List<ClassDescriptor> customAnnotationDescriptors: const [],
      bool inlineViews: false,
      bool reflectPropertiesAsAttributes: true,
      bool formatCode: false}) {
    var annotationMatcher = new AnnotationMatcher()
      ..addAll(customAnnotationDescriptors);
    var entryPointGlobs = entryPoints != null
        ? entryPoints.map((path) => new Glob(path)).toList(growable: false)
        : null;
    return new TransformerOptions._internal(entryPoints, entryPointGlobs,
        modeName, mirrorMode, initReflector, annotationMatcher,
        reflectPropertiesAsAttributes: reflectPropertiesAsAttributes,
        inlineViews: inlineViews,
        formatCode: formatCode);
  }
}
