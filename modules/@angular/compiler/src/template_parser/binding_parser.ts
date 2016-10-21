/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {SchemaMetadata, SecurityContext} from '@angular/core';

import {CompilePipeMetadata} from '../compile_metadata';
import {AST, ASTWithSource, BindingPipe, EmptyExpr, Interpolation, LiteralPrimitive, ParserError, RecursiveAstVisitor, TemplateBinding} from '../expression_parser/ast';
import {Parser} from '../expression_parser/parser';
import {isPresent} from '../facade/lang';
import {InterpolationConfig} from '../ml_parser/interpolation_config';
import {mergeNsAndName} from '../ml_parser/tags';
import {ParseError, ParseErrorLevel, ParseSourceSpan} from '../parse_util';
import {view_utils} from '../private_import_core';
import {ElementSchemaRegistry} from '../schema/element_schema_registry';
import {splitAtColon, splitAtPeriod} from '../util';

import {BoundElementPropertyAst, BoundEventAst, PropertyBindingType, VariableAst} from './template_ast';

const PROPERTY_PARTS_SEPARATOR = '.';
const ATTRIBUTE_PREFIX = 'attr';
const CLASS_PREFIX = 'class';
const STYLE_PREFIX = 'style';

const ANIMATE_PROP_PREFIX = 'animate-';

/**
 * Type of a parsed property
 */
export enum BoundPropertyType {
  DEFAULT,
  LITERAL_ATTR,
  ANIMATION
}

/**
 * Represents a parsed property.
 */
export class BoundProperty {
  constructor(
      public name: string, public expression: ASTWithSource, public type: BoundPropertyType,
      public sourceSpan: ParseSourceSpan) {}

  get isLiteral() { return this.type === BoundPropertyType.LITERAL_ATTR; }

  get isAnimation() { return this.type === BoundPropertyType.ANIMATION; }
}

/**
 * Parses bindings in templates and in the directive host area.
 */
export class BindingParser {
  pipesByName: Map<string, CompilePipeMetadata> = new Map();
  errors: ParseError[] = [];

  constructor(
      private _exprParser: Parser, private _interpolationConfig: InterpolationConfig,
      protected _schemaRegistry: ElementSchemaRegistry, protected _schemas: SchemaMetadata[],
      pipes: CompilePipeMetadata[]) {
    pipes.forEach(pipe => this.pipesByName.set(pipe.name, pipe));
  }

  createDirectiveHostPropertyAsts(
      elementName: string, hostProps: {[key: string]: string}, sourceSpan: ParseSourceSpan,
      targetPropertyAsts: BoundElementPropertyAst[]) {
    if (hostProps) {
      const boundProps: BoundProperty[] = [];
      Object.keys(hostProps).forEach(propName => {
        const expression = hostProps[propName];
        if (typeof expression === 'string') {
          this.parsePropertyBinding(propName, expression, true, sourceSpan, [], boundProps);
        } else {
          this.reportError(
              `Value of the host property binding "${propName}" needs to be a string representing an expression but got "${expression}" (${typeof expression})`,
              sourceSpan);
        }
      });
      boundProps.forEach(
          (prop) => { targetPropertyAsts.push(this.createElementPropertyAst(elementName, prop)); });
    }
  }

  createDirectiveHostEventAsts(
      hostListeners: {[key: string]: string}, sourceSpan: ParseSourceSpan,
      targetEventAsts: BoundEventAst[]) {
    if (hostListeners) {
      Object.keys(hostListeners).forEach(propName => {
        const expression = hostListeners[propName];
        if (typeof expression === 'string') {
          this.parseEvent(propName, expression, sourceSpan, [], targetEventAsts);
        } else {
          this.reportError(
              `Value of the host listener "${propName}" needs to be a string representing an expression but got "${expression}" (${typeof expression})`,
              sourceSpan);
        }
      });
    }
  }

  parseInterpolation(value: string, sourceSpan: ParseSourceSpan): ASTWithSource {
    const sourceInfo = sourceSpan.start.toString();

    try {
      const ast = this._exprParser.parseInterpolation(value, sourceInfo, this._interpolationConfig);
      if (ast) this._reportExpressionParserErrors(ast.errors, sourceSpan);
      this._checkPipes(ast, sourceSpan);
      if (ast &&
          (<Interpolation>ast.ast).expressions.length > view_utils.MAX_INTERPOLATION_VALUES) {
        throw new Error(
            `Only support at most ${view_utils.MAX_INTERPOLATION_VALUES} interpolation values!`);
      }
      return ast;
    } catch (e) {
      this.reportError(`${e}`, sourceSpan);
      return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
    }
  }

  parseInlineTemplateBinding(
      name: string, value: string, sourceSpan: ParseSourceSpan, targetMatchableAttrs: string[][],
      targetProps: BoundProperty[], targetVars: VariableAst[]) {
    const bindings = this._parseTemplateBindings(value, sourceSpan);
    for (let i = 0; i < bindings.length; i++) {
      const binding = bindings[i];
      if (binding.keyIsVar) {
        targetVars.push(new VariableAst(binding.key, binding.name, sourceSpan));
      } else if (isPresent(binding.expression)) {
        this._parsePropertyAst(
            binding.key, binding.expression, sourceSpan, targetMatchableAttrs, targetProps);
      } else {
        targetMatchableAttrs.push([binding.key, '']);
        this.parseLiteralAttr(binding.key, null, sourceSpan, targetMatchableAttrs, targetProps);
      }
    }
  }

  private _parseTemplateBindings(value: string, sourceSpan: ParseSourceSpan): TemplateBinding[] {
    const sourceInfo = sourceSpan.start.toString();

    try {
      const bindingsResult = this._exprParser.parseTemplateBindings(value, sourceInfo);
      this._reportExpressionParserErrors(bindingsResult.errors, sourceSpan);
      bindingsResult.templateBindings.forEach((binding) => {
        if (isPresent(binding.expression)) {
          this._checkPipes(binding.expression, sourceSpan);
        }
      });
      bindingsResult.warnings.forEach(
          (warning) => { this.reportError(warning, sourceSpan, ParseErrorLevel.WARNING); });
      return bindingsResult.templateBindings;
    } catch (e) {
      this.reportError(`${e}`, sourceSpan);
      return [];
    }
  }

  parseLiteralAttr(
      name: string, value: string, sourceSpan: ParseSourceSpan, targetMatchableAttrs: string[][],
      targetProps: BoundProperty[]) {
    if (_isAnimationLabel(name)) {
      name = name.substring(1);
      if (isPresent(value) && value.length > 0) {
        this.reportError(
            `Assigning animation triggers via @prop="exp" attributes with an expression is invalid.` +
                ` Use property bindings (e.g. [@prop]="exp") or use an attribute without a value (e.g. @prop) instead.`,
            sourceSpan, ParseErrorLevel.FATAL);
      }
      this._parseAnimation(name, value, sourceSpan, targetMatchableAttrs, targetProps);
    } else {
      targetProps.push(new BoundProperty(
          name, this._exprParser.wrapLiteralPrimitive(value, ''), BoundPropertyType.LITERAL_ATTR,
          sourceSpan));
    }
  }

  parsePropertyBinding(
      name: string, expression: string, isHost: boolean, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetProps: BoundProperty[]) {
    let isAnimationProp = false;
    if (name.startsWith(ANIMATE_PROP_PREFIX)) {
      isAnimationProp = true;
      name = name.substring(ANIMATE_PROP_PREFIX.length);
    } else if (_isAnimationLabel(name)) {
      isAnimationProp = true;
      name = name.substring(1);
    }

    if (isAnimationProp) {
      this._parseAnimation(name, expression, sourceSpan, targetMatchableAttrs, targetProps);
    } else {
      this._parsePropertyAst(
          name, this._parseBinding(expression, isHost, sourceSpan), sourceSpan,
          targetMatchableAttrs, targetProps);
    }
  }

  parsePropertyInterpolation(
      name: string, value: string, sourceSpan: ParseSourceSpan, targetMatchableAttrs: string[][],
      targetProps: BoundProperty[]): boolean {
    const expr = this.parseInterpolation(value, sourceSpan);
    if (isPresent(expr)) {
      this._parsePropertyAst(name, expr, sourceSpan, targetMatchableAttrs, targetProps);
      return true;
    }
    return false;
  }

  private _parsePropertyAst(
      name: string, ast: ASTWithSource, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetProps: BoundProperty[]) {
    targetMatchableAttrs.push([name, ast.source]);
    targetProps.push(new BoundProperty(name, ast, BoundPropertyType.DEFAULT, sourceSpan));
  }

  private _parseAnimation(
      name: string, expression: string, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetProps: BoundProperty[]) {
    // This will occur when a @trigger is not paired with an expression.
    // For animations it is valid to not have an expression since */void
    // states will be applied by angular when the element is attached/detached
    const ast = this._parseBinding(expression || 'null', false, sourceSpan);
    targetMatchableAttrs.push([name, ast.source]);
    targetProps.push(new BoundProperty(name, ast, BoundPropertyType.ANIMATION, sourceSpan));
  }

  private _parseBinding(value: string, isHostBinding: boolean, sourceSpan: ParseSourceSpan):
      ASTWithSource {
    const sourceInfo = sourceSpan.start.toString();

    try {
      const ast = isHostBinding ?
          this._exprParser.parseSimpleBinding(value, sourceInfo, this._interpolationConfig) :
          this._exprParser.parseBinding(value, sourceInfo, this._interpolationConfig);
      if (ast) this._reportExpressionParserErrors(ast.errors, sourceSpan);
      this._checkPipes(ast, sourceSpan);
      return ast;
    } catch (e) {
      this.reportError(`${e}`, sourceSpan);
      return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
    }
  }

  createElementPropertyAst(elementName: string, boundProp: BoundProperty): BoundElementPropertyAst {
    if (boundProp.isAnimation) {
      return new BoundElementPropertyAst(
          boundProp.name, PropertyBindingType.Animation, SecurityContext.NONE, boundProp.expression,
          null, boundProp.sourceSpan);
    }

    let unit: string = null;
    let bindingType: PropertyBindingType;
    let boundPropertyName: string;
    const parts = boundProp.name.split(PROPERTY_PARTS_SEPARATOR);
    let securityContext: SecurityContext;

    if (parts.length === 1) {
      var partValue = parts[0];
      boundPropertyName = this._schemaRegistry.getMappedPropName(partValue);
      securityContext = this._schemaRegistry.securityContext(elementName, boundPropertyName);
      bindingType = PropertyBindingType.Property;
      this._validatePropertyOrAttributeName(boundPropertyName, boundProp.sourceSpan, false);
      if (!this._schemaRegistry.hasProperty(elementName, boundPropertyName, this._schemas)) {
        let errorMsg =
            `Can't bind to '${boundPropertyName}' since it isn't a known property of '${elementName}'.`;
        if (elementName.indexOf('-') > -1) {
          errorMsg +=
              `\n1. If '${elementName}' is an Angular component and it has '${boundPropertyName}' input, then verify that it is part of this module.` +
              `\n2. If '${elementName}' is a Web Component then add "CUSTOM_ELEMENTS_SCHEMA" to the '@NgModule.schemas' of this component to suppress this message.\n`;
        }
        this.reportError(errorMsg, boundProp.sourceSpan);
      }
    } else {
      if (parts[0] == ATTRIBUTE_PREFIX) {
        boundPropertyName = parts[1];
        this._validatePropertyOrAttributeName(boundPropertyName, boundProp.sourceSpan, true);
        // NB: For security purposes, use the mapped property name, not the attribute name.
        const mapPropName = this._schemaRegistry.getMappedPropName(boundPropertyName);
        securityContext = this._schemaRegistry.securityContext(elementName, mapPropName);

        const nsSeparatorIdx = boundPropertyName.indexOf(':');
        if (nsSeparatorIdx > -1) {
          const ns = boundPropertyName.substring(0, nsSeparatorIdx);
          const name = boundPropertyName.substring(nsSeparatorIdx + 1);
          boundPropertyName = mergeNsAndName(ns, name);
        }

        bindingType = PropertyBindingType.Attribute;
      } else if (parts[0] == CLASS_PREFIX) {
        boundPropertyName = parts[1];
        bindingType = PropertyBindingType.Class;
        securityContext = SecurityContext.NONE;
      } else if (parts[0] == STYLE_PREFIX) {
        unit = parts.length > 2 ? parts[2] : null;
        boundPropertyName = parts[1];
        bindingType = PropertyBindingType.Style;
        securityContext = SecurityContext.STYLE;
      } else {
        this.reportError(`Invalid property name '${boundProp.name}'`, boundProp.sourceSpan);
        bindingType = null;
        securityContext = null;
      }
    }

    return new BoundElementPropertyAst(
        boundPropertyName, bindingType, securityContext, boundProp.expression, unit,
        boundProp.sourceSpan);
  }

  parseEvent(
      name: string, expression: string, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetEvents: BoundEventAst[]) {
    if (_isAnimationLabel(name)) {
      name = name.substr(1);
      this._parseAnimationEvent(name, expression, sourceSpan, targetEvents);
    } else {
      this._parseEvent(name, expression, sourceSpan, targetMatchableAttrs, targetEvents);
    }
  }

  private _parseAnimationEvent(
      name: string, expression: string, sourceSpan: ParseSourceSpan,
      targetEvents: BoundEventAst[]) {
    const matches = splitAtPeriod(name, [name, '']);
    const eventName = matches[0];
    const phase = matches[1].toLowerCase();
    if (phase) {
      switch (phase) {
        case 'start':
        case 'done':
          const ast = this._parseAction(expression, sourceSpan);
          targetEvents.push(new BoundEventAst(eventName, null, phase, ast, sourceSpan));
          break;

        default:
          this.reportError(
              `The provided animation output phase value "${phase}" for "@${eventName}" is not supported (use start or done)`,
              sourceSpan);
          break;
      }
    } else {
      this.reportError(
          `The animation trigger output event (@${eventName}) is missing its phase value name (start or done are currently supported)`,
          sourceSpan);
    }
  }

  private _parseEvent(
      name: string, expression: string, sourceSpan: ParseSourceSpan,
      targetMatchableAttrs: string[][], targetEvents: BoundEventAst[]) {
    // long format: 'target: eventName'
    const [target, eventName] = splitAtColon(name, [null, name]);
    const ast = this._parseAction(expression, sourceSpan);
    targetMatchableAttrs.push([name, ast.source]);
    targetEvents.push(new BoundEventAst(eventName, target, null, ast, sourceSpan));
    // Don't detect directives for event names for now,
    // so don't add the event name to the matchableAttrs
  }

  private _parseAction(value: string, sourceSpan: ParseSourceSpan): ASTWithSource {
    const sourceInfo = sourceSpan.start.toString();

    try {
      const ast = this._exprParser.parseAction(value, sourceInfo, this._interpolationConfig);
      if (ast) {
        this._reportExpressionParserErrors(ast.errors, sourceSpan);
      }
      if (!ast || ast.ast instanceof EmptyExpr) {
        this.reportError(`Empty expressions are not allowed`, sourceSpan);
        return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
      }
      this._checkPipes(ast, sourceSpan);
      return ast;
    } catch (e) {
      this.reportError(`${e}`, sourceSpan);
      return this._exprParser.wrapLiteralPrimitive('ERROR', sourceInfo);
    }
  }

  reportError(
      message: string, sourceSpan: ParseSourceSpan,
      level: ParseErrorLevel = ParseErrorLevel.FATAL) {
    this.errors.push(new ParseError(sourceSpan, message, level));
  }

  private _reportExpressionParserErrors(errors: ParserError[], sourceSpan: ParseSourceSpan) {
    for (const error of errors) {
      this.reportError(error.message, sourceSpan);
    }
  }

  private _checkPipes(ast: ASTWithSource, sourceSpan: ParseSourceSpan) {
    if (isPresent(ast)) {
      const collector = new PipeCollector();
      ast.visit(collector);
      collector.pipes.forEach((pipeName) => {
        if (!this.pipesByName.has(pipeName)) {
          this.reportError(`The pipe '${pipeName}' could not be found`, sourceSpan);
        }
      });
    }
  }

  /**
   * @param propName the name of the property / attribute
   * @param sourceSpan
   * @param isAttr true when binding to an attribute
   * @private
   */
  private _validatePropertyOrAttributeName(
      propName: string, sourceSpan: ParseSourceSpan, isAttr: boolean): void {
    const report = isAttr ? this._schemaRegistry.validateAttribute(propName) :
                            this._schemaRegistry.validateProperty(propName);
    if (report.error) {
      this.reportError(report.msg, sourceSpan, ParseErrorLevel.FATAL);
    }
  }
}

export class PipeCollector extends RecursiveAstVisitor {
  pipes: Set<string> = new Set<string>();
  visitPipe(ast: BindingPipe, context: any): any {
    this.pipes.add(ast.name);
    ast.exp.visit(this);
    this.visitAll(ast.args, context);
    return null;
  }
}

function _isAnimationLabel(name: string): boolean {
  return name[0] == '@';
}
