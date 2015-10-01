library angular2.transform.common.registered_type;

import 'package:analyzer/analyzer.dart';
import 'package:angular2/src/core/render/api.dart';
import 'package:angular2/src/transform/common/names.dart';

/// A call to `Reflector#registerType` generated by `DirectiveProcessor`.
class RegisteredType {
  /// The type registered by this call.
  final Identifier typeName;

  /// The actual call to `Reflector#registerType`.
  final MethodInvocation registerMethod;

  /// The `ReflectionInfo` [InstanceCreationExpression]
  final InstanceCreationExpression reflectionInfoCreate;

  /// The factory method registered.
  final Expression factoryFn;

  /// The parameters registered.
  final Expression parameters;

  /// The annotations registered.
  final Expression annotations;

  /// The property metadata registered.
  final Expression propMetadata;

  RegisteredType._(
      this.typeName,
      this.registerMethod,
      this.reflectionInfoCreate,
      this.factoryFn,
      this.parameters,
      this.annotations,
      this.propMetadata);

  /// Creates a {@link RegisteredType} given a {@link MethodInvocation} node representing
  /// a call to `registerType`.
  factory RegisteredType.fromMethodInvocation(MethodInvocation registerMethod) {
    var visitor = new _ParseRegisterTypeVisitor();
    registerMethod.accept(visitor);
    return new RegisteredType._(visitor.typeName, registerMethod, visitor.info,
        visitor.factoryFn, visitor.parameters, visitor.annotations, visitor.propMetadata);
  }

  RenderDirectiveMetadata get directiveMetadata => null;
}

class _ParseRegisterTypeVisitor extends Object
    with RecursiveAstVisitor<Object> {
  Identifier typeName;
  InstanceCreationExpression info;
  Expression factoryFn;
  Expression parameters;
  Expression annotations;
  Expression propMetadata;

  @override
  Object visitMethodInvocation(MethodInvocation node) {
    assert('${node.methodName}' == REGISTER_TYPE_METHOD_NAME);

    // The first argument to a `registerType` call is the type.
    typeName = node.argumentList.arguments[0] is Identifier
        ? node.argumentList.arguments[0]
        : null;

    // The second argument to a `registerType` call is the `ReflectionInfo`
    // object creation.
    info = node.argumentList.arguments[1] as InstanceCreationExpression;
    var args = info.argumentList.arguments;
    for (int i = 0; i < args.length; i++) {
      var arg = args[i];
      if (i == 0) {
        annotations = arg;
      } else if (i == 1) {
        parameters = arg;
      } else if (i == 2) {
        factoryFn = arg;
      } else if (i == 4) {
        propMetadata = arg;
      }
    }

    return null;
  }
}
