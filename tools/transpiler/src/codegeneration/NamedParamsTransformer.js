import {ParseTreeTransformer} from 'traceur/src/codegeneration/ParseTreeTransformer';
import {
  BINDING_ELEMENT,
  OBJECT_PATTERN,
  OBJECT_LITERAL_EXPRESSION
} from 'traceur/src/syntax/trees/ParseTreeType';

import {NamedParams} from '../ast/named_params';
import {ObjectPatternBindingElement} from '../ast/object_pattern_binding_element';

/**
 * Transforms maps into named parameters:
 *
 *  First, it transform all calls where the last argument is an object literal
 *  with identifier keys, as follows:
 *
 *    f({a: 1, b: 2}) -> f(a: 1, b: 2)
 *
 *  Second, it removes the empty object initializer from the function definition:
 *
 *    function f({a:1, b:2} = {}){} -> f({a:1, b:2}){}
 */
export class NamedParamsTransformer extends ParseTreeTransformer {
  /**
   * @param {CallExpression} tree
   * @return {ParseTree}
   */
  transformCallExpression(tree) {
    tree = super.transformCallExpression(tree);
    if (this._isLastArgAnNonEmptyObjectLiteral(tree) &&
      ! this._isLastArgObjectLiteralWithQuotedKeys(tree)) {
      this._replaceLastArgWithNamedParams(tree);
    }
    return tree;
  }

  _isLastArgAnNonEmptyObjectLiteral(tree) {
    var lastArg = this._last(tree.args.args);
    if (!lastArg) return false;

    var pairs = lastArg.propertyNameAndValues;
    if (!pairs || pairs.length == 0) return false;

    return true;
  }

  _isLastArgObjectLiteralWithQuotedKeys(tree) {
    var pairs = this._last(tree.args.args).propertyNameAndValues;

    for (var pair of pairs) {
      var key = pair.name.literalToken.value;
      if (key.charAt(0) == '"' || key.charAt(0) == "'") return true;
    }

    return false;
  }

  _replaceLastArgWithNamedParams(tree) {
    var args = tree.args.args;
    var last = this._last(args);
    args[args.length - 1] = new NamedParams(last.location, last.propertyNameAndValues);
  }

  /**
   * @param {ObjectPattern} tree
   * @return {ParseTree}
   */
  transformObjectPattern(tree) {
    tree = super.transformObjectPattern(tree);
    tree.fields = tree.fields.map(
      (e) => new ObjectPatternBindingElement(e.location, e.binding, e.initializer));
    return tree;
  }

  /**
   * @param {FormalParameterList} tree
   * @return {ParseTree}
   */
  transformFormalParameterList(tree) {
    tree = super.transformFormalParameterList(tree);
    var last = this._last(tree.parameters);
    if (last && this._isObjectPatternWithAnEmptyObjectInit(last.parameter)) {
      last.parameter = last.parameter.binding;
    }
    return tree;
  }

  _isObjectPatternWithAnEmptyObjectInit(tree) {
    return tree.type === BINDING_ELEMENT &&
        tree.binding.type === OBJECT_PATTERN &&
        this._isEmptyObjectInitializer(tree.initializer)
  }

  _isEmptyObjectInitializer(initializer) {
    return initializer &&
        initializer.type == OBJECT_LITERAL_EXPRESSION &&
        initializer.propertyNameAndValues.length == 0;
  }

  _last(array) {
    if (!array || array.length == 0) return undefined;
    return array[array.length - 1];
  }
}
