import {RegExpWrapper, StringWrapper, isPresent} from 'facade/lang';
import {Node, DOM} from 'facade/dom';

import {CompileStep} from './compile_step';
import {CompileElement} from './compile_element';
import {CompileControl} from './compile_control';

// TODO(tbosch): Cannot make this const/final right now because of the transpiler...
var INTERPOLATION_REGEXP = RegExpWrapper.create('\\{\\{(.*?)\\}\\}');
var QUOTE_REGEXP = RegExpWrapper.create("'");

/**
 * Parses interpolations in direct text child nodes of the current element.
 *
 * Fills:
 * - CompileElement#textNodeBindings
 */
export class TextInterpolationParser extends CompileStep {
  process(parent:CompileElement, current:CompileElement, control:CompileControl) {
    var element = current.element;
    var childNodes = DOM.templateAwareRoot(element).childNodes;
    for (var i=0; i<childNodes.length; i++) {
      var node = childNodes[i];
      if (node.nodeType === Node.TEXT_NODE) {
        this._parseTextNode(current, node, i);
      }
    }
  }

  _parseTextNode(pipelineElement, node, nodeIndex) {
    // TODO: add stringify formatter when we support formatters
    var parts = StringWrapper.split(node.nodeValue, INTERPOLATION_REGEXP);
    if (parts.length > 1) {
      var expression = '';
      for (var i=0; i<parts.length; i++) {
        var expressionPart = null;
        if (i%2 === 0) {
          // fixed string
          if (parts[i].length > 0) {
            expressionPart = "'" + StringWrapper.replaceAll(parts[i], QUOTE_REGEXP, "\\'") + "'";
          }
        } else {
          // expression
          expressionPart = "(" + parts[i] + ")";
        }
        if (isPresent(expressionPart)) {
          if (expression.length > 0) {
            expression += '+';
          }
          expression += expressionPart;
        }
      }
      DOM.setText(node, ' ');
      pipelineElement.addTextNodeBinding(nodeIndex, expression);
    }
  }
}
