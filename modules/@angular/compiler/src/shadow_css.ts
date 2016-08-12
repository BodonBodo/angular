/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ListWrapper} from './facade/collection';
import {StringWrapper, isBlank, isPresent} from './facade/lang';

/**
 * This file is a port of shadowCSS from webcomponents.js to TypeScript.
 *
 * Please make sure to keep to edits in sync with the source file.
 *
 * Source:
 * https://github.com/webcomponents/webcomponentsjs/blob/4efecd7e0e/src/ShadowCSS/ShadowCSS.js
 *
 * The original file level comment is reproduced below
 */

/*
  This is a limited shim for ShadowDOM css styling.
  https://dvcs.w3.org/hg/webcomponents/raw-file/tip/spec/shadow/index.html#styles

  The intention here is to support only the styling features which can be
  relatively simply implemented. The goal is to allow users to avoid the
  most obvious pitfalls and do so without compromising performance significantly.
  For ShadowDOM styling that's not covered here, a set of best practices
  can be provided that should allow users to accomplish more complex styling.

  The following is a list of specific ShadowDOM styling features and a brief
  discussion of the approach used to shim.

  Shimmed features:

  * :host, :host-context: ShadowDOM allows styling of the shadowRoot's host
  element using the :host rule. To shim this feature, the :host styles are
  reformatted and prefixed with a given scope name and promoted to a
  document level stylesheet.
  For example, given a scope name of .foo, a rule like this:

    :host {
        background: red;
      }
    }

  becomes:

    .foo {
      background: red;
    }

  * encapsultion: Styles defined within ShadowDOM, apply only to
  dom inside the ShadowDOM. Polymer uses one of two techniques to implement
  this feature.

  By default, rules are prefixed with the host element tag name
  as a descendant selector. This ensures styling does not leak out of the 'top'
  of the element's ShadowDOM. For example,

  div {
      font-weight: bold;
    }

  becomes:

  x-foo div {
      font-weight: bold;
    }

  becomes:


  Alternatively, if WebComponents.ShadowCSS.strictStyling is set to true then
  selectors are scoped by adding an attribute selector suffix to each
  simple selector that contains the host element tag name. Each element
  in the element's ShadowDOM template is also given the scope attribute.
  Thus, these rules match only elements that have the scope attribute.
  For example, given a scope name of x-foo, a rule like this:

    div {
      font-weight: bold;
    }

  becomes:

    div[x-foo] {
      font-weight: bold;
    }

  Note that elements that are dynamically added to a scope must have the scope
  selector added to them manually.

  * upper/lower bound encapsulation: Styles which are defined outside a
  shadowRoot should not cross the ShadowDOM boundary and should not apply
  inside a shadowRoot.

  This styling behavior is not emulated. Some possible ways to do this that
  were rejected due to complexity and/or performance concerns include: (1) reset
  every possible property for every possible selector for a given scope name;
  (2) re-implement css in javascript.

  As an alternative, users should make sure to use selectors
  specific to the scope in which they are working.

  * ::distributed: This behavior is not emulated. It's often not necessary
  to style the contents of a specific insertion point and instead, descendants
  of the host element can be styled selectively. Users can also create an
  extra node around an insertion point and style that node's contents
  via descendent selectors. For example, with a shadowRoot like this:

    <style>
      ::content(div) {
        background: red;
      }
    </style>
    <content></content>

  could become:

    <style>
      / *@polyfill .content-container div * /
      ::content(div) {
        background: red;
      }
    </style>
    <div class="content-container">
      <content></content>
    </div>

  Note the use of @polyfill in the comment above a ShadowDOM specific style
  declaration. This is a directive to the styling shim to use the selector
  in comments in lieu of the next selector when running under polyfill.
*/

export class ShadowCss {
  strictStyling: boolean = true;

  constructor() {}

  /*
  * Shim some cssText with the given selector. Returns cssText that can
  * be included in the document via WebComponents.ShadowCSS.addCssToDocument(css).
  *
  * When strictStyling is true:
  * - selector is the attribute added to all elements inside the host,
  * - hostSelector is the attribute added to the host itself.
  */
  shimCssText(cssText: string, selector: string, hostSelector: string = ''): string {
    const sourceMappingUrl: string = extractSourceMappingUrl(cssText);
    cssText = stripComments(cssText);
    cssText = this._insertDirectives(cssText);
    return this._scopeCssText(cssText, selector, hostSelector) + sourceMappingUrl;
  }

  private _insertDirectives(cssText: string): string {
    cssText = this._insertPolyfillDirectivesInCssText(cssText);
    return this._insertPolyfillRulesInCssText(cssText);
  }

  /*
   * Process styles to convert native ShadowDOM rules that will trip
   * up the css parser; we rely on decorating the stylesheet with inert rules.
   *
   * For example, we convert this rule:
   *
   * polyfill-next-selector { content: ':host menu-item'; }
   * ::content menu-item {
   *
   * to this:
   *
   * scopeName menu-item {
   *
  **/
  private _insertPolyfillDirectivesInCssText(cssText: string): string {
    // Difference with webcomponents.js: does not handle comments
    return StringWrapper.replaceAllMapped(
        cssText, _cssContentNextSelectorRe,
        function(m: any /** TODO #9100 */) { return m[1] + '{'; });
  }

  /*
   * Process styles to add rules which will only apply under the polyfill
   *
   * For example, we convert this rule:
   *
   * polyfill-rule {
   *   content: ':host menu-item';
   * ...
   * }
   *
   * to this:
   *
   * scopeName menu-item {...}
   *
  **/
  private _insertPolyfillRulesInCssText(cssText: string): string {
    // Difference with webcomponents.js: does not handle comments
    return StringWrapper.replaceAllMapped(
        cssText, _cssContentRuleRe, function(m: any /** TODO #9100 */) {
          let rule = m[0];
          rule = StringWrapper.replace(rule, m[1], '');
          rule = StringWrapper.replace(rule, m[2], '');
          return m[3] + rule;
        });
  }

  /* Ensure styles are scoped. Pseudo-scoping takes a rule like:
   *
   *  .foo {... }
   *
   *  and converts this to
   *
   *  scopeName .foo { ... }
  */
  private _scopeCssText(cssText: string, scopeSelector: string, hostSelector: string): string {
    const unscoped = this._extractUnscopedRulesFromCssText(cssText);
    cssText = this._insertPolyfillHostInCssText(cssText);
    cssText = this._convertColonHost(cssText);
    cssText = this._convertColonHostContext(cssText);
    cssText = this._convertShadowDOMSelectors(cssText);
    if (isPresent(scopeSelector)) {
      cssText = this._scopeSelectors(cssText, scopeSelector, hostSelector);
    }
    cssText = cssText + '\n' + unscoped;
    return cssText.trim();
  }

  /*
   * Process styles to add rules which will only apply under the polyfill
   * and do not process via CSSOM. (CSSOM is destructive to rules on rare
   * occasions, e.g. -webkit-calc on Safari.)
   * For example, we convert this rule:
   *
   * @polyfill-unscoped-rule {
   *   content: 'menu-item';
   * ... }
   *
   * to this:
   *
   * menu-item {...}
   *
  **/
  private _extractUnscopedRulesFromCssText(cssText: string): string {
    // Difference with webcomponents.js: does not handle comments
    let r = '';
    let m: RegExpExecArray;
    _cssContentUnscopedRuleRe.lastIndex = 0;
    while ((m = _cssContentUnscopedRuleRe.exec(cssText)) !== null) {
      let rule = m[0];
      rule = StringWrapper.replace(rule, m[2], '');
      rule = StringWrapper.replace(rule, m[1], m[3]);
      r += rule + '\n\n';
    }
    return r;
  }

  /*
   * convert a rule like :host(.foo) > .bar { }
   *
   * to
   *
   * scopeName.foo > .bar
  */
  private _convertColonHost(cssText: string): string {
    return this._convertColonRule(cssText, _cssColonHostRe, this._colonHostPartReplacer);
  }

  /*
   * convert a rule like :host-context(.foo) > .bar { }
   *
   * to
   *
   * scopeName.foo > .bar, .foo scopeName > .bar { }
   *
   * and
   *
   * :host-context(.foo:host) .bar { ... }
   *
   * to
   *
   * scopeName.foo .bar { ... }
  */
  private _convertColonHostContext(cssText: string): string {
    return this._convertColonRule(
        cssText, _cssColonHostContextRe, this._colonHostContextPartReplacer);
  }

  private _convertColonRule(cssText: string, regExp: RegExp, partReplacer: Function): string {
    // p1 = :host, p2 = contents of (), p3 rest of rule
    return StringWrapper.replaceAllMapped(cssText, regExp, function(m: any /** TODO #9100 */) {
      if (isPresent(m[2])) {
        const parts = m[2].split(','), r: any[] /** TODO #9100 */ = [];
        for (let i = 0; i < parts.length; i++) {
          let p = parts[i];
          if (isBlank(p)) break;
          p = p.trim();
          r.push(partReplacer(_polyfillHostNoCombinator, p, m[3]));
        }
        return r.join(',');
      } else {
        return _polyfillHostNoCombinator + m[3];
      }
    });
  }

  private _colonHostContextPartReplacer(host: string, part: string, suffix: string): string {
    if (StringWrapper.contains(part, _polyfillHost)) {
      return this._colonHostPartReplacer(host, part, suffix);
    } else {
      return host + part + suffix + ', ' + part + ' ' + host + suffix;
    }
  }

  private _colonHostPartReplacer(host: string, part: string, suffix: string): string {
    return host + StringWrapper.replace(part, _polyfillHost, '') + suffix;
  }

  /*
   * Convert combinators like ::shadow and pseudo-elements like ::content
   * by replacing with space.
  */
  private _convertShadowDOMSelectors(cssText: string): string {
    return _shadowDOMSelectorsRe.reduce(
        (result, pattern) => { return StringWrapper.replaceAll(result, pattern, ' '); }, cssText);
  }

  // change a selector like 'div' to 'name div'
  private _scopeSelectors(cssText: string, scopeSelector: string, hostSelector: string): string {
    return processRules(cssText, (rule: CssRule) => {
      let selector = rule.selector;
      let content = rule.content;
      if (rule.selector[0] != '@' || rule.selector.startsWith('@page')) {
        selector =
            this._scopeSelector(rule.selector, scopeSelector, hostSelector, this.strictStyling);
      } else if (rule.selector.startsWith('@media') || rule.selector.startsWith('@supports')) {
        content = this._scopeSelectors(rule.content, scopeSelector, hostSelector);
      }
      return new CssRule(selector, content);
    });
  }

  private _scopeSelector(
      selector: string, scopeSelector: string, hostSelector: string, strict: boolean): string {
    return selector.split(',')
        .map((part) => { return StringWrapper.split(part.trim(), _shadowDeepSelectors); })
        .map((deepParts) => {
          const [shallowPart, ...otherParts] = deepParts;
          const applyScope = (shallowPart: string) => {
            if (this._selectorNeedsScoping(shallowPart, scopeSelector)) {
              return strict && !StringWrapper.contains(shallowPart, _polyfillHostNoCombinator) ?
                  this._applyStrictSelectorScope(shallowPart, scopeSelector) :
                  this._applySelectorScope(shallowPart, scopeSelector, hostSelector);
            } else {
              return shallowPart;
            }
          };
          return [applyScope(shallowPart), ...otherParts].join(' ');
        })
        .join(', ');
  }

  private _selectorNeedsScoping(selector: string, scopeSelector: string): boolean {
    const re = this._makeScopeMatcher(scopeSelector);
    return !re.test(selector);
  }

  private _makeScopeMatcher(scopeSelector: string): RegExp {
    const lre = /\[/g;
    const rre = /\]/g;
    scopeSelector = StringWrapper.replaceAll(scopeSelector, lre, '\\[');
    scopeSelector = StringWrapper.replaceAll(scopeSelector, rre, '\\]');
    return new RegExp('^(' + scopeSelector + ')' + _selectorReSuffix, 'm');
  }

  private _applySelectorScope(selector: string, scopeSelector: string, hostSelector: string):
      string {
    // Difference from webcomponentsjs: scopeSelector could not be an array
    return this._applySimpleSelectorScope(selector, scopeSelector, hostSelector);
  }

  // scope via name and [is=name]
  private _applySimpleSelectorScope(selector: string, scopeSelector: string, hostSelector: string):
      string {
    if (_polyfillHostRe.test(selector)) {
      const replaceBy = this.strictStyling ? `[${hostSelector}]` : scopeSelector;
      selector = StringWrapper.replace(selector, _polyfillHostNoCombinator, replaceBy);
      return StringWrapper.replaceAll(selector, _polyfillHostRe, replaceBy + ' ');
    } else {
      return scopeSelector + ' ' + selector;
    }
  }

  // return a selector with [name] suffix on each simple selector
  // e.g. .foo.bar > .zot becomes .foo[name].bar[name] > .zot[name]  /** @internal */
  private _applyStrictSelectorScope(selector: string, scopeSelector: string): string {
    const isRe = /\[is=([^\]]*)\]/g;
    scopeSelector =
        StringWrapper.replaceAllMapped(scopeSelector, isRe, (m: any /** TODO #9100 */) => m[1]);
    const splits = [' ', '>', '+', '~'];
    let scoped = selector;
    const attrName = '[' + scopeSelector + ']';
    for (let i = 0; i < splits.length; i++) {
      const sep = splits[i];
      const parts = scoped.split(sep);
      scoped = parts
                   .map(p => {
                     // remove :host since it should be unnecessary
                     const t = StringWrapper.replaceAll(p.trim(), _polyfillHostRe, '');
                     if (t.length > 0 && !ListWrapper.contains(splits, t) &&
                         !StringWrapper.contains(t, attrName)) {
                       const m = t.match(/([^:]*)(:*)(.*)/);
                       if (m !== null) {
                         p = m[1] + attrName + m[2] + m[3];
                       }
                     }
                     return p;
                   })
                   .join(sep);
    }
    return scoped;
  }

  private _insertPolyfillHostInCssText(selector: string): string {
    selector = StringWrapper.replaceAll(selector, _colonHostContextRe, _polyfillHostContext);
    selector = StringWrapper.replaceAll(selector, _colonHostRe, _polyfillHost);
    return selector;
  }
}
const _cssContentNextSelectorRe =
    /polyfill-next-selector[^}]*content:[\s]*?['"](.*?)['"][;\s]*}([^{]*?){/gim;
const _cssContentRuleRe = /(polyfill-rule)[^}]*(content:[\s]*['"](.*?)['"])[;\s]*[^}]*}/gim;
const _cssContentUnscopedRuleRe =
    /(polyfill-unscoped-rule)[^}]*(content:[\s]*['"](.*?)['"])[;\s]*[^}]*}/gim;
const _polyfillHost = '-shadowcsshost';
// note: :host-context pre-processed to -shadowcsshostcontext.
const _polyfillHostContext = '-shadowcsscontext';
const _parenSuffix = ')(?:\\((' +
    '(?:\\([^)(]*\\)|[^)(]*)+?' +
    ')\\))?([^,{]*)';
const _cssColonHostRe = new RegExp('(' + _polyfillHost + _parenSuffix, 'gim');
const _cssColonHostContextRe = new RegExp('(' + _polyfillHostContext + _parenSuffix, 'gim');
const _polyfillHostNoCombinator = _polyfillHost + '-no-combinator';
const _shadowDOMSelectorsRe = [
  /::shadow/g, /::content/g,
  // Deprecated selectors
  // TODO(vicb): see https://github.com/angular/clang-format/issues/16
  // clang-format off
  /\/shadow-deep\//g,  // former /deep/
  /\/shadow\//g,       // former ::shadow
  // clanf-format on
];
const _shadowDeepSelectors = /(?:>>>)|(?:\/deep\/)/g;
const _selectorReSuffix = '([>\\s~+\[.,{:][\\s\\S]*)?$';
const _polyfillHostRe = new RegExp(_polyfillHost, 'im');
const _colonHostRe = /:host/gim;
const _colonHostContextRe = /:host-context/gim;

const _commentRe = /\/\*\s*[\s\S]*?\*\//g;

function stripComments(input:string):string {
  return StringWrapper.replaceAllMapped(input, _commentRe, (_: any /** TODO #9100 */) => '');
}

// all comments except inline source mapping ("/* #sourceMappingURL= ... */")
const _sourceMappingUrlRe = /[\s\S]*(\/\*\s*#\s*sourceMappingURL=[\s\S]+?\*\/)\s*$/;

function extractSourceMappingUrl(input:string):string {
  const matcher = input.match(_sourceMappingUrlRe);
  return matcher ? matcher[1] : '';
}

const _ruleRe = /(\s*)([^;\{\}]+?)(\s*)((?:{%BLOCK%}?\s*;?)|(?:\s*;))/g;
const _curlyRe = /([{}])/g;
const OPEN_CURLY = '{';
const CLOSE_CURLY = '}';
const BLOCK_PLACEHOLDER = '%BLOCK%';

export class CssRule {
  constructor(public selector:string, public content:string) {}
}

export function processRules(input:string, ruleCallback:Function):string {
  const inputWithEscapedBlocks = escapeBlocks(input);
  let nextBlockIndex = 0;
  return StringWrapper.replaceAllMapped(inputWithEscapedBlocks.escapedString, _ruleRe, function(m: any /** TODO #9100 */) {
    const selector = m[2];
    let content = '';
    let suffix = m[4];
    let contentPrefix = '';
    if (isPresent(m[4]) && m[4].startsWith('{'+BLOCK_PLACEHOLDER)) {
      content = inputWithEscapedBlocks.blocks[nextBlockIndex++];
      suffix = m[4].substring(BLOCK_PLACEHOLDER.length+1);
      contentPrefix = '{';
    }
    const rule = ruleCallback(new CssRule(selector, content));
    return `${m[1]}${rule.selector}${m[3]}${contentPrefix}${rule.content}${suffix}`;
  });
}

class StringWithEscapedBlocks {
  constructor(public escapedString:string, public blocks:string[]) {}
}

function escapeBlocks(input:string):StringWithEscapedBlocks {
  const inputParts = StringWrapper.split(input, _curlyRe);
  const resultParts: any[] /** TODO #9100 */ = [];
  const escapedBlocks: any[] /** TODO #9100 */ = [];
  let bracketCount = 0;
  let currentBlockParts: any[] /** TODO #9100 */ = [];
  for (let partIndex = 0; partIndex<inputParts.length; partIndex++) {
    const part = inputParts[partIndex];
    if (part == CLOSE_CURLY) {
      bracketCount--;
    }
    if (bracketCount > 0) {
      currentBlockParts.push(part);
    } else {
      if (currentBlockParts.length > 0) {
        escapedBlocks.push(currentBlockParts.join(''));
        resultParts.push(BLOCK_PLACEHOLDER);
        currentBlockParts = [];
      }
      resultParts.push(part);
    }
    if (part == OPEN_CURLY) {
      bracketCount++;
    }
  }
  if (currentBlockParts.length > 0) {
    escapedBlocks.push(currentBlockParts.join(''));
    resultParts.push(BLOCK_PLACEHOLDER);
  }
  return new StringWithEscapedBlocks(resultParts.join(''), escapedBlocks);
}
