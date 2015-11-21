import {ListWrapper, StringMapWrapper, SetWrapper} from 'angular2/src/facade/collection';
import {RegExpWrapper, isPresent, StringWrapper, isBlank} from 'angular2/src/facade/lang';
import {Injectable, Inject, OpaqueToken, Optional} from 'angular2/core';
import {CONST_EXPR} from 'angular2/src/facade/lang';
import {BaseException} from 'angular2/src/facade/exceptions';
import {Parser, AST, ASTWithSource} from 'angular2/src/core/change_detection/change_detection';
import {TemplateBinding} from 'angular2/src/core/change_detection/parser/ast';
import {CompileDirectiveMetadata} from './directive_metadata';
import {HtmlParser} from './html_parser';
import {ParseSourceSpan, ParseError, ParseLocation} from './parse_util';


import {
  ElementAst,
  BoundElementPropertyAst,
  BoundEventAst,
  VariableAst,
  TemplateAst,
  TemplateAstVisitor,
  templateVisitAll,
  TextAst,
  BoundTextAst,
  EmbeddedTemplateAst,
  AttrAst,
  NgContentAst,
  PropertyBindingType,
  DirectiveAst,
  BoundDirectivePropertyAst
} from './template_ast';
import {CssSelector, SelectorMatcher} from 'angular2/src/compiler/selector';

import {ElementSchemaRegistry} from 'angular2/src/compiler/schema/element_schema_registry';
import {preparseElement, PreparsedElement, PreparsedElementType} from './template_preparser';

import {isStyleUrlResolvable} from './style_url_resolver';

import {
  HtmlAstVisitor,
  HtmlAst,
  HtmlElementAst,
  HtmlAttrAst,
  HtmlTextAst,
  htmlVisitAll
} from './html_ast';

import {dashCaseToCamelCase, camelCaseToDashCase, splitAtColon} from './util';

// Group 1 = "bind-"
// Group 2 = "var-" or "#"
// Group 3 = "on-"
// Group 4 = "bindon-"
// Group 5 = the identifier after "bind-", "var-/#", or "on-"
// Group 6 = idenitifer inside [()]
// Group 7 = idenitifer inside []
// Group 8 = identifier inside ()
var BIND_NAME_REGEXP =
    /^(?:(?:(?:(bind-)|(var-|#)|(on-)|(bindon-))(.+))|\[\(([^\)]+)\)\]|\[([^\]]+)\]|\(([^\)]+)\))$/ig;

const TEMPLATE_ELEMENT = 'template';
const TEMPLATE_ATTR = 'template';
const TEMPLATE_ATTR_PREFIX = '*';
const CLASS_ATTR = 'class';

var PROPERTY_PARTS_SEPARATOR = '.';
const ATTRIBUTE_PREFIX = 'attr';
const CLASS_PREFIX = 'class';
const STYLE_PREFIX = 'style';

var TEXT_CSS_SELECTOR = CssSelector.parse('*')[0];

export const TEMPLATE_TRANSFORMS = CONST_EXPR(new OpaqueToken('TemplateTransforms'));

export class TemplateParseError extends ParseError {
  constructor(message: string, location: ParseLocation) { super(location, message); }
}

@Injectable()
export class TemplateParser {
  constructor(private _exprParser: Parser, private _schemaRegistry: ElementSchemaRegistry,
              private _htmlParser: HtmlParser,
              @Optional() @Inject(TEMPLATE_TRANSFORMS) public transforms: TemplateAstVisitor[]) {}

  parse(template: string, directives: CompileDirectiveMetadata[],
        templateUrl: string): TemplateAst[] {
    var parseVisitor = new TemplateParseVisitor(directives, this._exprParser, this._schemaRegistry);
    var htmlAstWithErrors = this._htmlParser.parse(template, templateUrl);
    var result = htmlVisitAll(parseVisitor, htmlAstWithErrors.rootNodes, EMPTY_COMPONENT);
    var errors: ParseError[] = htmlAstWithErrors.errors.concat(parseVisitor.errors);
    if (errors.length > 0) {
      var errorString = errors.join('\n');
      throw new BaseException(`Template parse errors:\n${errorString}`);
    }
    if (isPresent(this.transforms)) {
      this.transforms.forEach(
          (transform: TemplateAstVisitor) => { result = templateVisitAll(transform, result); });
    }
    return result;
  }
}

class TemplateParseVisitor implements HtmlAstVisitor {
  selectorMatcher: SelectorMatcher;
  errors: TemplateParseError[] = [];
  directivesIndex = new Map<CompileDirectiveMetadata, number>();
  ngContentCount: number = 0;

  constructor(directives: CompileDirectiveMetadata[], private _exprParser: Parser,
              private _schemaRegistry: ElementSchemaRegistry) {
    this.selectorMatcher = new SelectorMatcher();
    ListWrapper.forEachWithIndex(directives,
                                 (directive: CompileDirectiveMetadata, index: number) => {
                                   var selector = CssSelector.parse(directive.selector);
                                   this.selectorMatcher.addSelectables(selector, directive);
                                   this.directivesIndex.set(directive, index);
                                 });
  }

  private _reportError(message: string, sourceSpan: ParseSourceSpan) {
    this.errors.push(new TemplateParseError(message, sourceSpan.start));
  }

  private _parseInterpolation(value: string, sourceSpan: ParseSourceSpan): ASTWithSource {
    var sourceInfo = sourceSpan.start.toString();
    try {
      return this._exprParser.parseInterpolation(value, sourceInfo);
    } catch (e) {
      this._reportError(`${e}`, sourceSpan);
      return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
    }
  }

  private _parseAction(value: string, sourceSpan: ParseSourceSpan): ASTWithSource {
    var sourceInfo = sourceSpan.start.toString();
    try {
      return this._exprParser.parseAction(value, sourceInfo);
    } catch (e) {
      this._reportError(`${e}`, sourceSpan);
      return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
    }
  }

  private _parseBinding(value: string, sourceSpan: ParseSourceSpan): ASTWithSource {
    var sourceInfo = sourceSpan.start.toString();
    try {
      return this._exprParser.parseBinding(value, sourceInfo);
    } catch (e) {
      this._reportError(`${e}`, sourceSpan);
      return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
    }
  }

  private _parseTemplateBindings(value: string, sourceSpan: ParseSourceSpan): TemplateBinding[] {
    var sourceInfo = sourceSpan.start.toString();
    try {
      return this._exprParser.parseTemplateBindings(value, sourceInfo);
    } catch (e) {
      this._reportError(`${e}`, sourceSpan);
      return [];
    }
  }

  visitText(ast: HtmlTextAst, component: Component): any {
    var ngContentIndex = component.findNgContentIndex(TEXT_CSS_SELECTOR);
    var expr = this._parseInterpolation(ast.value, ast.sourceSpan);
    if (isPresent(expr)) {
      return new BoundTextAst(expr, ngContentIndex, ast.sourceSpan);
    } else {
      return new TextAst(ast.value, ngContentIndex, ast.sourceSpan);
    }
  }

  visitAttr(ast: HtmlAttrAst, contex: any): any {
    return new AttrAst(ast.name, ast.value, ast.sourceSpan);
  }

  visitElement(element: HtmlElementAst, component: Component): any {
    var nodeName = element.name;
    var preparsedElement = preparseElement(element);
    if (preparsedElement.type === PreparsedElementType.SCRIPT ||
        preparsedElement.type === PreparsedElementType.STYLE) {
      // Skipping <script> for security reasons
      // Skipping <style> as we already processed them
      // in the StyleCompiler
      return null;
    }
    if (preparsedElement.type === PreparsedElementType.STYLESHEET &&
        isStyleUrlResolvable(preparsedElement.hrefAttr)) {
      // Skipping stylesheets with either relative urls or package scheme as we already processed
      // them in the StyleCompiler
      return null;
    }

    var matchableAttrs: string[][] = [];
    var elementOrDirectiveProps: BoundElementOrDirectiveProperty[] = [];
    var vars: VariableAst[] = [];
    var events: BoundEventAst[] = [];

    var templateElementOrDirectiveProps: BoundElementOrDirectiveProperty[] = [];
    var templateVars: VariableAst[] = [];
    var templateMatchableAttrs: string[][] = [];
    var hasInlineTemplates = false;
    var attrs = [];

    element.attrs.forEach(attr => {
      matchableAttrs.push([attr.name, attr.value]);
      var hasBinding = this._parseAttr(attr, matchableAttrs, elementOrDirectiveProps, events, vars);
      var hasTemplateBinding = this._parseInlineTemplateBinding(
          attr, templateMatchableAttrs, templateElementOrDirectiveProps, templateVars);
      if (!hasBinding && !hasTemplateBinding) {
        // don't include the bindings as attributes as well in the AST
        attrs.push(this.visitAttr(attr, null));
      }
      if (hasTemplateBinding) {
        hasInlineTemplates = true;
      }
    });

    var isTemplateElement = nodeName.toLowerCase() == TEMPLATE_ELEMENT;
    var elementCssSelector = createElementCssSelector(nodeName, matchableAttrs);
    var directives = this._createDirectiveAsts(
        element.name, this._parseDirectives(this.selectorMatcher, elementCssSelector),
        elementOrDirectiveProps, isTemplateElement ? [] : vars, element.sourceSpan);
    var elementProps: BoundElementPropertyAst[] =
        this._createElementPropertyAsts(element.name, elementOrDirectiveProps, directives);
    var children = htmlVisitAll(preparsedElement.nonBindable ? NON_BINDABLE_VISITOR : this,
                                element.children, Component.create(directives));
    var elementNgContentIndex =
        hasInlineTemplates ? null : component.findNgContentIndex(elementCssSelector);
    var parsedElement;
    if (preparsedElement.type === PreparsedElementType.NG_CONTENT) {
      parsedElement =
          new NgContentAst(this.ngContentCount++, elementNgContentIndex, element.sourceSpan);
    } else if (isTemplateElement) {
      this._assertAllEventsPublishedByDirectives(directives, events);
      this._assertNoComponentsNorElementBindingsOnTemplate(directives, elementProps,
                                                           element.sourceSpan);
      parsedElement = new EmbeddedTemplateAst(attrs, events, vars, directives, children,
                                              elementNgContentIndex, element.sourceSpan);
    } else {
      this._assertOnlyOneComponent(directives, element.sourceSpan);
      var elementExportAsVars = vars.filter(varAst => varAst.value.length === 0);
      parsedElement =
          new ElementAst(nodeName, attrs, elementProps, events, elementExportAsVars, directives,
                         children, elementNgContentIndex, element.sourceSpan);
    }
    if (hasInlineTemplates) {
      var templateCssSelector = createElementCssSelector(TEMPLATE_ELEMENT, templateMatchableAttrs);
      var templateDirectives = this._createDirectiveAsts(
          element.name, this._parseDirectives(this.selectorMatcher, templateCssSelector),
          templateElementOrDirectiveProps, [], element.sourceSpan);
      var templateElementProps: BoundElementPropertyAst[] = this._createElementPropertyAsts(
          element.name, templateElementOrDirectiveProps, templateDirectives);
      this._assertNoComponentsNorElementBindingsOnTemplate(templateDirectives, templateElementProps,
                                                           element.sourceSpan);
      parsedElement = new EmbeddedTemplateAst(
          [], [], templateVars, templateDirectives, [parsedElement],
          component.findNgContentIndex(templateCssSelector), element.sourceSpan);
    }
    return parsedElement;
  }

  private _parseInlineTemplateBinding(attr: HtmlAttrAst, targetMatchableAttrs: string[][],
                                      targetProps: BoundElementOrDirectiveProperty[],
                                      targetVars: VariableAst[]): boolean {
    var templateBindingsSource = null;
    if (attr.name.toLowerCase() == TEMPLATE_ATTR) {
      templateBindingsSource = attr.value;
    } else if (attr.name.startsWith(TEMPLATE_ATTR_PREFIX)) {
      var key = attr.name.substring(TEMPLATE_ATTR_PREFIX.length);  // remove the star
      templateBindingsSource = (attr.value.length == 0) ? key : key + ' ' + attr.value;
    }
    if (isPresent(templateBindingsSource)) {
      var bindings = this._parseTemplateBindings(templateBindingsSource, attr.sourceSpan);
      for (var i = 0; i < bindings.length; i++) {
        var binding = bindings[i];
        var dashCaseKey = camelCaseToDashCase(binding.key);
        if (binding.keyIsVar) {
          targetVars.push(
              new VariableAst(dashCaseToCamelCase(binding.key), binding.name, attr.sourceSpan));
          targetMatchableAttrs.push([dashCaseKey, binding.name]);
        } else if (isPresent(binding.expression)) {
          this._parsePropertyAst(dashCaseKey, binding.expression, attr.sourceSpan,
                                 targetMatchableAttrs, targetProps);
        } else {
          targetMatchableAttrs.push([dashCaseKey, '']);
          this._parseLiteralAttr(dashCaseKey, null, attr.sourceSpan, targetProps);
        }
      }
      return true;
    }
    return false;
  }

  private _parseAttr(attr: HtmlAttrAst, targetMatchableAttrs: string[][],
                     targetProps: BoundElementOrDirectiveProperty[], targetEvents: BoundEventAst[],
                     targetVars: VariableAst[]): boolean {
    var attrName = this._normalizeAttributeName(attr.name);
    var attrValue = attr.value;
    var bindParts = RegExpWrapper.firstMatch(BIND_NAME_REGEXP, attrName);
    var hasBinding = false;
    if (isPresent(bindParts)) {
      hasBinding = true;
      if (isPresent(bindParts[1])) {  // match: bind-prop
        this._parseProperty(bindParts[5], attrValue, attr.sourceSpan, targetMatchableAttrs,
                            targetProps);

      } else if (isPresent(
                     bindParts[2])) {  // match: var-name / var-name="iden" / #name / #name="iden"
        var identifier = bindParts[5];
        this._parseVariable(identifier, attrValue, attr.sourceSpan, targetVars);

      } else if (isPresent(bindParts[3])) {  // match: on-event
        this._parseEvent(bindParts[5], attrValue, attr.sourceSpan, targetMatchableAttrs,
                         targetEvents);

      } else if (isPresent(bindParts[4])) {  // match: bindon-prop
        this._parseProperty(bindParts[5], attrValue, attr.sourceSpan, targetMatchableAttrs,
                            targetProps);
        this._parseAssignmentEvent(bindParts[5], attrValue, attr.sourceSpan, targetMatchableAttrs,
                                   targetEvents);

      } else if (isPresent(bindParts[6])) {  // match: [(expr)]
        this._parseProperty(bindParts[6], attrValue, attr.sourceSpan, targetMatchableAttrs,
                            targetProps);
        this._parseAssignmentEvent(bindParts[6], attrValue, attr.sourceSpan, targetMatchableAttrs,
                                   targetEvents);

      } else if (isPresent(bindParts[7])) {  // match: [expr]
        this._parseProperty(bindParts[7], attrValue, attr.sourceSpan, targetMatchableAttrs,
                            targetProps);

      } else if (isPresent(bindParts[8])) {  // match: (event)
        this._parseEvent(bindParts[8], attrValue, attr.sourceSpan, targetMatchableAttrs,
                         targetEvents);
      }
    } else {
      hasBinding = this._parsePropertyInterpolation(attrName, attrValue, attr.sourceSpan,
                                                    targetMatchableAttrs, targetProps);
    }
    if (!hasBinding) {
      this._parseLiteralAttr(attrName, attrValue, attr.sourceSpan, targetProps);
    }
    return hasBinding;
  }

  private _normalizeAttributeName(attrName: string): string {
    return attrName.toLowerCase().startsWith('data-') ? attrName.substring(5) : attrName;
  }

  private _parseVariable(identifier: string, value: string, sourceSpan: ParseSourceSpan,
                         targetVars: VariableAst[]) {
    targetVars.push(new VariableAst(dashCaseToCamelCase(identifier), value, sourceSpan));
  }

  private _parseProperty(name: string, expression: string, sourceSpan: ParseSourceSpan,
                         targetMatchableAttrs: string[][],
                         targetProps: BoundElementOrDirectiveProperty[]) {
    this._parsePropertyAst(name, this._parseBinding(expression, sourceSpan), sourceSpan,
                           targetMatchableAttrs, targetProps);
  }

  private _parsePropertyInterpolation(name: string, value: string, sourceSpan: ParseSourceSpan,
                                      targetMatchableAttrs: string[][],
                                      targetProps: BoundElementOrDirectiveProperty[]): boolean {
    var expr = this._parseInterpolation(value, sourceSpan);
    if (isPresent(expr)) {
      this._parsePropertyAst(name, expr, sourceSpan, targetMatchableAttrs, targetProps);
      return true;
    }
    return false;
  }

  private _parsePropertyAst(name: string, ast: ASTWithSource, sourceSpan: ParseSourceSpan,
                            targetMatchableAttrs: string[][],
                            targetProps: BoundElementOrDirectiveProperty[]) {
    targetMatchableAttrs.push([name, ast.source]);
    targetProps.push(new BoundElementOrDirectiveProperty(name, ast, false, sourceSpan));
  }

  private _parseAssignmentEvent(name: string, expression: string, sourceSpan: ParseSourceSpan,
                                targetMatchableAttrs: string[][], targetEvents: BoundEventAst[]) {
    this._parseEvent(`${name}-change`, `${expression}=$event`, sourceSpan, targetMatchableAttrs,
                     targetEvents);
  }

  private _parseEvent(name: string, expression: string, sourceSpan: ParseSourceSpan,
                      targetMatchableAttrs: string[][], targetEvents: BoundEventAst[]) {
    // long format: 'target: eventName'
    var parts = splitAtColon(name, [null, name]);
    var target = parts[0];
    var eventName = parts[1];
    targetEvents.push(new BoundEventAst(dashCaseToCamelCase(eventName), target,
                                        this._parseAction(expression, sourceSpan), sourceSpan));
    // Don't detect directives for event names for now,
    // so don't add the event name to the matchableAttrs
  }

  private _parseLiteralAttr(name: string, value: string, sourceSpan: ParseSourceSpan,
                            targetProps: BoundElementOrDirectiveProperty[]) {
    targetProps.push(new BoundElementOrDirectiveProperty(
        dashCaseToCamelCase(name), this._exprParser.wrapLiteralPrimitive(value, ''), true,
        sourceSpan));
  }

  private _parseDirectives(selectorMatcher: SelectorMatcher,
                           elementCssSelector: CssSelector): CompileDirectiveMetadata[] {
    var directives = [];
    selectorMatcher.match(elementCssSelector,
                          (selector, directive) => { directives.push(directive); });
    // Need to sort the directives so that we get consistent results throughout,
    // as selectorMatcher uses Maps inside.
    // Also need to make components the first directive in the array
    ListWrapper.sort(directives,
                     (dir1: CompileDirectiveMetadata, dir2: CompileDirectiveMetadata) => {
                       var dir1Comp = dir1.isComponent;
                       var dir2Comp = dir2.isComponent;
                       if (dir1Comp && !dir2Comp) {
                         return -1;
                       } else if (!dir1Comp && dir2Comp) {
                         return 1;
                       } else {
                         return this.directivesIndex.get(dir1) - this.directivesIndex.get(dir2);
                       }
                     });
    return directives;
  }

  private _createDirectiveAsts(elementName: string, directives: CompileDirectiveMetadata[],
                               props: BoundElementOrDirectiveProperty[],
                               possibleExportAsVars: VariableAst[],
                               sourceSpan: ParseSourceSpan): DirectiveAst[] {
    var matchedVariables = new Set<string>();
    var directiveAsts = directives.map((directive: CompileDirectiveMetadata) => {
      var hostProperties: BoundElementPropertyAst[] = [];
      var hostEvents: BoundEventAst[] = [];
      var directiveProperties: BoundDirectivePropertyAst[] = [];
      this._createDirectiveHostPropertyAsts(elementName, directive.hostProperties, sourceSpan,
                                            hostProperties);
      this._createDirectiveHostEventAsts(directive.hostListeners, sourceSpan, hostEvents);
      this._createDirectivePropertyAsts(directive.inputs, props, directiveProperties);
      var exportAsVars = [];
      possibleExportAsVars.forEach((varAst) => {
        if ((varAst.value.length === 0 && directive.isComponent) ||
            (directive.exportAs == varAst.value)) {
          exportAsVars.push(varAst);
          matchedVariables.add(varAst.name);
        }
      });
      return new DirectiveAst(directive, directiveProperties, hostProperties, hostEvents,
                              exportAsVars, sourceSpan);
    });
    possibleExportAsVars.forEach((varAst) => {
      if (varAst.value.length > 0 && !SetWrapper.has(matchedVariables, varAst.name)) {
        this._reportError(`There is no directive with "exportAs" set to "${varAst.value}"`,
                          varAst.sourceSpan);
      }
    });
    return directiveAsts;
  }

  private _createDirectiveHostPropertyAsts(elementName: string, hostProps: {[key: string]: string},
                                           sourceSpan: ParseSourceSpan,
                                           targetPropertyAsts: BoundElementPropertyAst[]) {
    if (isPresent(hostProps)) {
      StringMapWrapper.forEach(hostProps, (expression, propName) => {
        var exprAst = this._parseBinding(expression, sourceSpan);
        targetPropertyAsts.push(
            this._createElementPropertyAst(elementName, propName, exprAst, sourceSpan));
      });
    }
  }

  private _createDirectiveHostEventAsts(hostListeners: {[key: string]: string},
                                        sourceSpan: ParseSourceSpan,
                                        targetEventAsts: BoundEventAst[]) {
    if (isPresent(hostListeners)) {
      StringMapWrapper.forEach(hostListeners, (expression, propName) => {
        this._parseEvent(propName, expression, sourceSpan, [], targetEventAsts);
      });
    }
  }

  private _createDirectivePropertyAsts(directiveProperties: {[key: string]: string},
                                       boundProps: BoundElementOrDirectiveProperty[],
                                       targetBoundDirectiveProps: BoundDirectivePropertyAst[]) {
    if (isPresent(directiveProperties)) {
      var boundPropsByName = new Map<string, BoundElementOrDirectiveProperty>();
      boundProps.forEach(boundProp => {
        var key = dashCaseToCamelCase(boundProp.name);
        var prevValue = boundPropsByName.get(boundProp.name);
        if (isBlank(prevValue) || prevValue.isLiteral) {
          // give [a]="b" a higher precedence thatn a="b" on the same element
          boundPropsByName.set(key, boundProp);
        }
      });

      StringMapWrapper.forEach(directiveProperties, (elProp: string, dirProp: string) => {
        elProp = dashCaseToCamelCase(elProp);
        var boundProp = boundPropsByName.get(elProp);

        // Bindings are optional, so this binding only needs to be set up if an expression is given.
        if (isPresent(boundProp)) {
          targetBoundDirectiveProps.push(new BoundDirectivePropertyAst(
              dirProp, boundProp.name, boundProp.expression, boundProp.sourceSpan));
        }
      });
    }
  }

  private _createElementPropertyAsts(elementName: string, props: BoundElementOrDirectiveProperty[],
                                     directives: DirectiveAst[]): BoundElementPropertyAst[] {
    var boundElementProps: BoundElementPropertyAst[] = [];
    var boundDirectivePropsIndex = new Map<string, BoundDirectivePropertyAst>();
    directives.forEach((directive: DirectiveAst) => {
      directive.inputs.forEach((prop: BoundDirectivePropertyAst) => {
        boundDirectivePropsIndex.set(prop.templateName, prop);
      });
    });
    props.forEach((prop: BoundElementOrDirectiveProperty) => {
      if (!prop.isLiteral && isBlank(boundDirectivePropsIndex.get(prop.name))) {
        boundElementProps.push(this._createElementPropertyAst(elementName, prop.name,
                                                              prop.expression, prop.sourceSpan));
      }
    });
    return boundElementProps;
  }

  private _createElementPropertyAst(elementName: string, name: string, ast: AST,
                                    sourceSpan: ParseSourceSpan): BoundElementPropertyAst {
    var unit = null;
    var bindingType;
    var boundPropertyName;
    var parts = name.split(PROPERTY_PARTS_SEPARATOR);
    if (parts.length === 1) {
      boundPropertyName = this._schemaRegistry.getMappedPropName(dashCaseToCamelCase(parts[0]));
      bindingType = PropertyBindingType.Property;
      if (!this._schemaRegistry.hasProperty(elementName, boundPropertyName)) {
        this._reportError(
            `Can't bind to '${boundPropertyName}' since it isn't a known native property`,
            sourceSpan);
      }
    } else {
      let lcPrefix = parts[0].toLowerCase();
      if (lcPrefix == ATTRIBUTE_PREFIX) {
        boundPropertyName = dashCaseToCamelCase(parts[1]);
        bindingType = PropertyBindingType.Attribute;
      } else if (lcPrefix == CLASS_PREFIX) {
        // keep original case!
        boundPropertyName = parts[1];
        bindingType = PropertyBindingType.Class;
      } else if (lcPrefix == STYLE_PREFIX) {
        unit = parts.length > 2 ? parts[2] : null;
        boundPropertyName = dashCaseToCamelCase(parts[1]);
        bindingType = PropertyBindingType.Style;
      } else {
        this._reportError(`Invalid property name ${name}`, sourceSpan);
        bindingType = null;
      }
    }

    return new BoundElementPropertyAst(boundPropertyName, bindingType, ast, unit, sourceSpan);
  }


  private _findComponentDirectiveNames(directives: DirectiveAst[]): string[] {
    var componentTypeNames: string[] = [];
    directives.forEach(directive => {
      var typeName = directive.directive.type.name;
      if (directive.directive.isComponent) {
        componentTypeNames.push(typeName);
      }
    });
    return componentTypeNames;
  }

  private _assertOnlyOneComponent(directives: DirectiveAst[], sourceSpan: ParseSourceSpan) {
    var componentTypeNames = this._findComponentDirectiveNames(directives);
    if (componentTypeNames.length > 1) {
      this._reportError(`More than one component: ${componentTypeNames.join(',')}`, sourceSpan);
    }
  }

  private _assertNoComponentsNorElementBindingsOnTemplate(directives: DirectiveAst[],
                                                          elementProps: BoundElementPropertyAst[],
                                                          sourceSpan: ParseSourceSpan) {
    var componentTypeNames: string[] = this._findComponentDirectiveNames(directives);
    if (componentTypeNames.length > 0) {
      this._reportError(`Components on an embedded template: ${componentTypeNames.join(',')}`,
                        sourceSpan);
    }
    elementProps.forEach(prop => {
      this._reportError(
          `Property binding ${prop.name} not used by any directive on an embedded template`,
          sourceSpan);
    });
  }

  private _assertAllEventsPublishedByDirectives(directives: DirectiveAst[],
                                                events: BoundEventAst[]) {
    var allDirectiveEvents = new Set<string>();
    directives.forEach(directive => {
      StringMapWrapper.forEach(directive.directive.outputs,
                               (eventName, _) => { allDirectiveEvents.add(eventName); });
    });
    events.forEach(event => {
      if (isPresent(event.target) || !SetWrapper.has(allDirectiveEvents, event.name)) {
        this._reportError(
            `Event binding ${event.fullName} not emitted by any directive on an embedded template`,
            event.sourceSpan);
      }
    });
  }
}

class NonBindableVisitor implements HtmlAstVisitor {
  visitElement(ast: HtmlElementAst, component: Component): ElementAst {
    var preparsedElement = preparseElement(ast);
    if (preparsedElement.type === PreparsedElementType.SCRIPT ||
        preparsedElement.type === PreparsedElementType.STYLE ||
        preparsedElement.type === PreparsedElementType.STYLESHEET) {
      // Skipping <script> for security reasons
      // Skipping <style> and stylesheets as we already processed them
      // in the StyleCompiler
      return null;
    }

    var attrNameAndValues = ast.attrs.map(attrAst => [attrAst.name, attrAst.value]);
    var selector = createElementCssSelector(ast.name, attrNameAndValues);
    var ngContentIndex = component.findNgContentIndex(selector);
    var children = htmlVisitAll(this, ast.children, EMPTY_COMPONENT);
    return new ElementAst(ast.name, htmlVisitAll(this, ast.attrs), [], [], [], [], children,
                          ngContentIndex, ast.sourceSpan);
  }
  visitAttr(ast: HtmlAttrAst, context: any): AttrAst {
    return new AttrAst(ast.name, ast.value, ast.sourceSpan);
  }
  visitText(ast: HtmlTextAst, component: Component): TextAst {
    var ngContentIndex = component.findNgContentIndex(TEXT_CSS_SELECTOR);
    return new TextAst(ast.value, ngContentIndex, ast.sourceSpan);
  }
}

class BoundElementOrDirectiveProperty {
  constructor(public name: string, public expression: AST, public isLiteral: boolean,
              public sourceSpan: ParseSourceSpan) {}
}

export function splitClasses(classAttrValue: string): string[] {
  return StringWrapper.split(classAttrValue.trim(), /\s+/g);
}

class Component {
  static create(directives: DirectiveAst[]): Component {
    if (directives.length === 0 || !directives[0].directive.isComponent) {
      return EMPTY_COMPONENT;
    }
    var matcher = new SelectorMatcher();
    var ngContentSelectors = directives[0].directive.template.ngContentSelectors;
    var wildcardNgContentIndex = null;
    for (var i = 0; i < ngContentSelectors.length; i++) {
      var selector = ngContentSelectors[i];
      if (StringWrapper.equals(selector, '*')) {
        wildcardNgContentIndex = i;
      } else {
        matcher.addSelectables(CssSelector.parse(ngContentSelectors[i]), i);
      }
    }
    return new Component(matcher, wildcardNgContentIndex);
  }
  constructor(public ngContentIndexMatcher: SelectorMatcher,
              public wildcardNgContentIndex: number) {}

  findNgContentIndex(selector: CssSelector): number {
    var ngContentIndices = [];
    this.ngContentIndexMatcher.match(
        selector, (selector, ngContentIndex) => { ngContentIndices.push(ngContentIndex); });
    ListWrapper.sort(ngContentIndices);
    if (isPresent(this.wildcardNgContentIndex)) {
      ngContentIndices.push(this.wildcardNgContentIndex);
    }
    return ngContentIndices.length > 0 ? ngContentIndices[0] : null;
  }
}

function createElementCssSelector(elementName: string, matchableAttrs: string[][]): CssSelector {
  var cssSelector = new CssSelector();

  cssSelector.setElement(elementName);
  for (var i = 0; i < matchableAttrs.length; i++) {
    var attrName = matchableAttrs[i][0].toLowerCase();
    var attrValue = matchableAttrs[i][1];
    cssSelector.addAttribute(attrName, attrValue);
    if (attrName == CLASS_ATTR) {
      var classes = splitClasses(attrValue);
      classes.forEach(className => cssSelector.addClassName(className));
    }
  }
  return cssSelector;
}

var EMPTY_COMPONENT = new Component(new SelectorMatcher(), null);
var NON_BINDABLE_VISITOR = new NonBindableVisitor();
