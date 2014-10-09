import {ParseTree} from 'traceur/src/syntax/trees/ParseTree';

import {PropertyMethodAssignment} from 'traceur/src/syntax/trees/ParseTrees';

import * as ParseTreeType from './ParseTreeType';

// Class field declaration
export class ClassFieldDeclaration extends ParseTree {
  constructor(location, lvalue, typeAnnotation, isFinal) {
    this.location = location;
    this.lvalue = lvalue;
    this.typeAnnotation = typeAnnotation;
    this.isFinal = isFinal;
  }

  get type() {
    return CLASS_FIELD_DECLARATION;
  }

  visit(visitor) {
    if (visitor.visitClassFieldDeclaration) {
      visitor.visitClassFieldDeclaration(this);
    }
  }

  transform(transformer) {
    if (transformer.transformClassFieldDeclaration) {
      return transformer.transformClassFieldDeclaration(this);
    }

    return this;
  }
}

var CLASS_FIELD_DECLARATION = ParseTreeType.CLASS_FIELD_DECLARATION;

// Class constructor
export class PropertyConstructorAssignment extends PropertyMethodAssignment {
  /**
   * @param {SourceRange} location
   * @param {boolean} isStatic
   * @param {Token} functionKind
   * @param {ParseTree} name
   * @param {FormalParameterList} parameterList
   * @param {ParseTree} typeAnnotation
   * @param {Array.<ParseTree>} annotations
   * @param {FunctionBody} body
   * @param {boolean} isConst
   * @param {ParseTree} initializerList
   */
  constructor(location, isStatic, functionKind, name, parameterList, typeAnnotation, annotations,
              body, isConst, initializerList) {
    super(location, isStatic, functionKind, name, parameterList, typeAnnotation, annotations,
          body);
    this.isConst = isConst;
    this.initializerList = initializerList;
  }

  /**
   * @param {ParseTreeTransformer} transformer
   */
  transform(transformer) {
    if (transformer.transformPropertyConstructorAssignment) {
      return transformer.transformPropertyConstructorAssignment(this);
    }

    return this;
  }

  /**
   * @param {ParseTreeVisitor} visitor
   */
  visit(visitor) {
    if (visitor.visitPropertyConstructorAssignment) {
      visitor.visitPropertyConstructorAssignment(this);
    }
  }

  /**
   * @type {ParseTreeType}
   */
  get type() {
    return PROPERTY_CONSTRUCTOR_ASSIGNMENT;
  }
}

var PROPERTY_CONSTRUCTOR_ASSIGNMENT = ParseTreeType.PROPERTY_CONSTRUCTOR_ASSIGNMENT;

// Named parameters
export class NamedParameterList extends ParseTree {
  /**
   * @param {SourceRange} location
   * @param {Array.<ParseTree>} parameterNameAndValues
   */
  constructor(location, parameterNameAndValues) {
    this.location = location;
    this.parameterNameAndValues = parameterNameAndValues;
  }

  /**
   * @param {ParseTreeTransformer} transformer
   */
  transform(transformer) {
    if (transformer.transformNamedParameterList) {
      return transformer.transformNamedParameterList(this);
    }

    return this;
  }

  /**
   * @param {ParseTreeVisitor} visitor
   */
  visit(visitor) {
    if (visitor.visitNamedParameterList) {
      visitor.visitNamedParameterList(this);
    }
  }

  /**
   * @type {ParseTreeType}
   */
  get type() {
    return NAMED_PARAMETER_LIST;
  }
}

var NAMED_PARAMETER_LIST = ParseTreeType.NAMED_PARAMETER_LIST;

// Object pattern binding element
export class ObjectPatternBindingElement extends ParseTree {
  /**
   * @param {SourceRange} location
   * @param {BindingIdentifier|ObjectPattern|ArrayPattern} binding
   * @param {ParseTree} initializer
   */
  constructor(location, binding, initializer) {
    this.location = location;
    this.binding = binding;
    this.initializer = initializer;
  }

  /**
   * @param {ParseTreeTransformer} transformer
   */
  transform(transformer) {
    if (transformer.transformObjectPatternBindingElement) {
      return transformer.transformObjectPatternBindingElement(this);
    }

    return this;
  }

  /**
   * @param {ParseTreeVisitor} visitor
   */
  visit(visitor) {
    if (visitor.visitObjectPatternBindingElement) {
      visitor.visitObjectPatternBindingElement(this);
    }
  }

  /**
   * @type {ParseTreeType}
   */
  get type() {
    return OBJECT_PATTERN_BINDING_ELEMENT;
  }
}
var OBJECT_PATTERN_BINDING_ELEMENT = ParseTreeType.OBJECT_PATTERN_BINDING_ELEMENT;
