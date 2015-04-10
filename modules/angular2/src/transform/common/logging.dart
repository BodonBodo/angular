library angular2.transform.common.logging;

import 'package:barback/barback.dart';
import 'package:code_transformers/messages/build_logger.dart';

BuildLogger _logger;

/// Prepares [logger] for use throughout the transformer.
void init(Transform t) {
  _logger = new BuildLogger(t);
}

/// Sets [logger] directly. Used for testing - in general use [init].
void setLogger(BuildLogger logger) {
  _logger = logger;
}

/// The logger the transformer should use for messaging.
BuildLogger get logger {
  if (_logger == null) {
    _logger = new PrintLogger();
  }
  return _logger;
}

class PrintLogger implements BuildLogger {
  void _printWithPrefix(prefix, msg) => print('$prefix: $msg');
  void info(msg, {AssetId asset, SourceSpan span}) =>
      _printWithPrefix('INFO', msg);
  void fine(msg, {AssetId asset, SourceSpan span}) =>
      _printWithPrefix('FINE', msg);
  void warning(msg, {AssetId asset, SourceSpan span}) =>
      _printWithPrefix('WARN', msg);
  void error(msg, {AssetId asset, SourceSpan span}) {
    throw new PrintLoggerError(msg, asset, span);
  }
  Future writeOutput() => null;
  Future addLogFilesFromAsset(AssetId id, [int nextNumber = 1]) => null;
}

class PrintLoggerError extends Error {
  final String message;
  final AssetId asset;
  final SourceSpan span;

  PrintLoggerError(message, asset, span);

  @override
  String toString() {
    return 'Message: ${Error.safeToString(message)}, '
        'Asset: ${Error.safeToString(asset)}, '
        'Span: ${Error.safeToString(span)}.';
  }
}
