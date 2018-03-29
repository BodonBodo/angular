/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CompileDirectiveMetadata, CompileDirectiveSummary, CompilePipeSummary, CompileQueryMetadata, CompileTokenMetadata, CompileTypeMetadata, flatten, identifierName, rendererTypeName, sanitizeIdentifier, tokenReference, viewClassName} from '../compile_metadata';
import {CompileReflector} from '../compile_reflector';
import {BindingForm, BuiltinConverter, BuiltinFunctionCall, ConvertPropertyBindingResult, EventHandlerVars, LocalResolver, convertActionBinding, convertPropertyBinding, convertPropertyBindingBuiltins} from '../compiler_util/expression_converter';
import {ConstantPool, DefinitionKind} from '../constant_pool';
import {AST, AstMemoryEfficientTransformer, AstTransformer, BindingPipe, FunctionCall, ImplicitReceiver, LiteralArray, LiteralMap, LiteralPrimitive, MethodCall, ParseSpan, PropertyRead} from '../expression_parser/ast';
import {Identifiers} from '../identifiers';
import {LifecycleHooks} from '../lifecycle_reflector';
import * as o from '../output/output_ast';
import {ParseSourceSpan, typeSourceSpan} from '../parse_util';
import {CssSelector} from '../selector';
import {BindingParser} from '../template_parser/binding_parser';
import {AttrAst, BoundDirectivePropertyAst, BoundElementPropertyAst, BoundEventAst, BoundTextAst, DirectiveAst, ElementAst, EmbeddedTemplateAst, NgContentAst, PropertyBindingType, ProviderAst, QueryMatch, RecursiveTemplateAstVisitor, ReferenceAst, TemplateAst, TemplateAstVisitor, TextAst, VariableAst, templateVisitAll} from '../template_parser/template_ast';
import {OutputContext, error} from '../util';
import {Identifiers as R3} from './r3_identifiers';
import {BUILD_OPTIMIZER_COLOCATE, OutputMode} from './r3_types';


/** Name of the context parameter passed into a template function */
const CONTEXT_NAME = 'ctx';

/** Name of the creation mode flag passed into a template function */
const CREATION_MODE_FLAG = 'cm';

/** Name of the temporary to use during data binding */
const TEMPORARY_NAME = '_t';

/** The prefix reference variables */
const REFERENCE_PREFIX = '_r';

/** The name of the implicit context reference */
const IMPLICIT_REFERENCE = '$implicit';

/** Name of the i18n attributes **/
const I18N_ATTR = 'i18n';
const I18N_ATTR_PREFIX = 'i18n-';

/** I18n separators for metadata **/
const MEANING_SEPARATOR = '|';
const ID_SEPARATOR = '@@';

export function compileDirective(
    outputCtx: OutputContext, directive: CompileDirectiveMetadata, reflector: CompileReflector,
    bindingParser: BindingParser, mode: OutputMode) {
  const definitionMapValues: {key: string, quoted: boolean, value: o.Expression}[] = [];

  const field = (key: string, value: o.Expression | null) => {
    if (value) {
      definitionMapValues.push({key, value, quoted: false});
    }
  };

  // e.g. 'type: MyDirective`
  field('type', outputCtx.importExpr(directive.type.reference));

  // e.g. `selectors: [['', 'someDir', '']]`
  field('selectors', createDirectiveSelector(directive.selector !));

  // e.g. `factory: () => new MyApp(injectElementRef())`
  field('factory', createFactory(directive.type, outputCtx, reflector, directive.queries));

  // e.g. `hostBindings: (dirIndex, elIndex) => { ... }
  field('hostBindings', createHostBindingsFunction(directive, outputCtx, bindingParser));

  // e.g. `attributes: ['role', 'listbox']`
  field('attributes', createHostAttributesArray(directive, outputCtx));

  // e.g 'inputs: {a: 'a'}`
  field('inputs', createInputsObject(directive, outputCtx));

  const className = identifierName(directive.type) !;
  className || error(`Cannot resolver the name of ${directive.type}`);

  const definitionField = outputCtx.constantPool.propertyNameOf(DefinitionKind.Directive);
  const definitionFunction =
      o.importExpr(R3.defineDirective).callFn([o.literalMap(definitionMapValues)]);

  if (mode === OutputMode.PartialClass) {
    // Create the partial class to be merged with the actual class.
    outputCtx.statements.push(new o.ClassStmt(
        /* name */ className,
        /* parent */ null,
        /* fields */[new o.ClassField(
            /* name */ definitionField,
            /* type */ o.INFERRED_TYPE,
            /* modifiers */[o.StmtModifier.Static],
            /* initializer */ definitionFunction)],
        /* getters */[],
        /* constructorMethod */ new o.ClassMethod(null, [], []),
        /* methods */[]));
  } else {
    // Create back-patch definition.
    const classReference = outputCtx.importExpr(directive.type.reference);

    // Create the back-patch statement
    outputCtx.statements.push(new o.CommentStmt(BUILD_OPTIMIZER_COLOCATE));
    outputCtx.statements.push(
        classReference.prop(definitionField).set(definitionFunction).toStmt());
  }
}

export function compileComponent(
    outputCtx: OutputContext, component: CompileDirectiveMetadata, pipes: CompilePipeSummary[],
    template: TemplateAst[], reflector: CompileReflector, bindingParser: BindingParser,
    mode: OutputMode) {
  const definitionMapValues: {key: string, quoted: boolean, value: o.Expression}[] = [];

  const field = (key: string, value: o.Expression | null) => {
    if (value) {
      definitionMapValues.push({key, value, quoted: false});
    }
  };

  // e.g. `type: MyApp`
  field('type', outputCtx.importExpr(component.type.reference));

  // e.g. `selectors: [['my-app']]`
  field('selectors', createDirectiveSelector(component.selector !));

  const selector = component.selector && CssSelector.parse(component.selector);
  const firstSelector = selector && selector[0];

  // e.g. `attr: ["class", ".my.app"]
  // This is optional an only included if the first selector of a component specifies attributes.
  if (firstSelector) {
    const selectorAttributes = firstSelector.getAttrs();
    if (selectorAttributes.length) {
      field(
          'attrs', outputCtx.constantPool.getConstLiteral(
                       o.literalArr(selectorAttributes.map(
                           value => value != null ? o.literal(value) : o.literal(undefined))),
                       /* forceShared */ true));
    }
  }

  // e.g. `factory: function MyApp_Factory() { return new MyApp(injectElementRef()); }`
  field('factory', createFactory(component.type, outputCtx, reflector, component.queries));

  // e.g `hostBindings: function MyApp_HostBindings { ... }
  field('hostBindings', createHostBindingsFunction(component, outputCtx, bindingParser));

  // e.g. `template: function MyComponent_Template(_ctx, _cm) {...}`
  const templateTypeName = component.type.reference.name;
  const templateName = templateTypeName ? `${templateTypeName}_Template` : null;
  const pipeMap = new Map(pipes.map<[string, CompilePipeSummary]>(pipe => [pipe.name, pipe]));
  const templateFunctionExpression =
      new TemplateDefinitionBuilder(
          outputCtx, outputCtx.constantPool, reflector, CONTEXT_NAME, ROOT_SCOPE.nestedScope(), 0,
          component.template !.ngContentSelectors, templateTypeName, templateName, pipeMap,
          component.viewQueries)
          .buildTemplateFunction(template, []);

  field('template', templateFunctionExpression);

  // e.g `inputs: {a: 'a'}`
  field('inputs', createInputsObject(component, outputCtx));

  // e.g. `features: [NgOnChangesFeature(MyComponent)]`
  const features: o.Expression[] = [];
  if (component.type.lifecycleHooks.some(lifecycle => lifecycle == LifecycleHooks.OnChanges)) {
    features.push(o.importExpr(R3.NgOnChangesFeature, null, null).callFn([outputCtx.importExpr(
        component.type.reference)]));
  }
  if (features.length) {
    field('features', o.literalArr(features));
  }

  const definitionField = outputCtx.constantPool.propertyNameOf(DefinitionKind.Component);
  const definitionFunction =
      o.importExpr(R3.defineComponent).callFn([o.literalMap(definitionMapValues)]);
  if (mode === OutputMode.PartialClass) {
    const className = identifierName(component.type) !;
    className || error(`Cannot resolver the name of ${component.type}`);

    // Create the partial class to be merged with the actual class.
    outputCtx.statements.push(new o.ClassStmt(
        /* name */ className,
        /* parent */ null,
        /* fields */[new o.ClassField(
            /* name */ definitionField,
            /* type */ o.INFERRED_TYPE,
            /* modifiers */[o.StmtModifier.Static],
            /* initializer */ definitionFunction)],
        /* getters */[],
        /* constructorMethod */ new o.ClassMethod(null, [], []),
        /* methods */[]));
  } else {
    const classReference = outputCtx.importExpr(component.type.reference);

    // Create the back-patch statement
    outputCtx.statements.push(
        new o.CommentStmt(BUILD_OPTIMIZER_COLOCATE),
        classReference.prop(definitionField).set(definitionFunction).toStmt());
  }
}

// TODO: Remove these when the things are fully supported
function unknown<T>(arg: o.Expression | o.Statement | TemplateAst): never {
  throw new Error(
      `Builder ${this.constructor.name} is unable to handle ${arg.constructor.name} yet`);
}

function unsupported(feature: string): never {
  if (this) {
    throw new Error(`Builder ${this.constructor.name} doesn't support ${feature} yet`);
  }
  throw new Error(`Feature ${feature} is not supported yet`);
}

const BINDING_INSTRUCTION_MAP: {[index: number]: o.ExternalReference | undefined} = {
  [PropertyBindingType.Property]: R3.elementProperty,
  [PropertyBindingType.Attribute]: R3.elementAttribute,
  [PropertyBindingType.Class]: R3.elementClassNamed,
  [PropertyBindingType.Style]: R3.elementStyleNamed
};

function interpolate(args: o.Expression[]): o.Expression {
  args = args.slice(1);  // Ignore the length prefix added for render2
  switch (args.length) {
    case 3:
      return o.importExpr(R3.interpolation1).callFn(args);
    case 5:
      return o.importExpr(R3.interpolation2).callFn(args);
    case 7:
      return o.importExpr(R3.interpolation3).callFn(args);
    case 9:
      return o.importExpr(R3.interpolation4).callFn(args);
    case 11:
      return o.importExpr(R3.interpolation5).callFn(args);
    case 13:
      return o.importExpr(R3.interpolation6).callFn(args);
    case 15:
      return o.importExpr(R3.interpolation7).callFn(args);
    case 17:
      return o.importExpr(R3.interpolation8).callFn(args);
  }
  (args.length >= 19 && args.length % 2 == 1) ||
      error(`Invalid interpolation argument length ${args.length}`);
  return o.importExpr(R3.interpolationV).callFn([o.literalArr(args)]);
}

function pipeBinding(args: o.Expression[]): o.ExternalReference {
  switch (args.length) {
    case 0:
      // The first parameter to pipeBind is always the value to be transformed followed
      // by arg.length arguments so the total number of arguments to pipeBind are
      // arg.length + 1.
      return R3.pipeBind1;
    case 1:
      return R3.pipeBind2;
    case 2:
      return R3.pipeBind3;
    default:
      return R3.pipeBindV;
  }
}

const pureFunctionIdentifiers = [
  R3.pureFunction0, R3.pureFunction1, R3.pureFunction2, R3.pureFunction3, R3.pureFunction4,
  R3.pureFunction5, R3.pureFunction6, R3.pureFunction7, R3.pureFunction8
];
function getLiteralFactory(
    outputContext: OutputContext, literal: o.LiteralArrayExpr | o.LiteralMapExpr): o.Expression {
  const {literalFactory, literalFactoryArguments} =
      outputContext.constantPool.getLiteralFactory(literal);
  literalFactoryArguments.length > 0 || error(`Expected arguments to a literal factory function`);
  let pureFunctionIdent =
      pureFunctionIdentifiers[literalFactoryArguments.length] || R3.pureFunctionV;

  // Literal factories are pure functions that only need to be re-invoked when the parameters
  // change.
  return o.importExpr(pureFunctionIdent).callFn([literalFactory, ...literalFactoryArguments]);
}

class BindingScope {
  private map = new Map<string, o.Expression>();
  private referenceNameIndex = 0;

  constructor(private parent: BindingScope|null) {}

  get(name: string): o.Expression|null {
    let current: BindingScope|null = this;
    while (current) {
      const value = current.map.get(name);
      if (value != null) {
        // Cache the value locally.
        this.map.set(name, value);
        return value;
      }
      current = current.parent;
    }
    return null;
  }

  set(name: string, value: o.Expression): BindingScope {
    !this.map.has(name) ||
        error(`The name ${name} is already defined in scope to be ${this.map.get(name)}`);
    this.map.set(name, value);
    return this;
  }

  nestedScope(): BindingScope { return new BindingScope(this); }

  freshReferenceName(): string {
    let current: BindingScope = this;
    // Find the top scope as it maintains the global reference count
    while (current.parent) current = current.parent;
    const ref = `${REFERENCE_PREFIX}${current.referenceNameIndex++}`;
    return ref;
  }
}

const ROOT_SCOPE = new BindingScope(null).set('$event', o.variable('$event'));

class TemplateDefinitionBuilder implements TemplateAstVisitor, LocalResolver {
  private _dataIndex = 0;
  private _bindingContext = 0;
  private _referenceIndex = 0;
  private _temporaryAllocated = false;
  private _prefix: o.Statement[] = [];
  private _creationMode: o.Statement[] = [];
  private _bindingMode: o.Statement[] = [];
  private _hostMode: o.Statement[] = [];
  private _refreshMode: o.Statement[] = [];
  private _postfix: o.Statement[] = [];
  private _contentProjections: Map<NgContentAst, NgContentInfo>;
  private _projectionDefinitionIndex = 0;
  private _valueConverter: ValueConverter;
  private unsupported = unsupported;
  private invalid = invalid;

  // Whether we are inside a translatable element (`<p i18n>... somewhere here ... </p>)
  private _inI18nSection: boolean = false;
  private _i18nSectionIndex = -1;
  // Maps of placeholder to node indexes for each of the i18n section
  private _phToNodeIdxes: {[phName: string]: number[]}[] = [{}];

  constructor(
      private outputCtx: OutputContext, private constantPool: ConstantPool,
      private reflector: CompileReflector, private contextParameter: string,
      private bindingScope: BindingScope, private level = 0, private ngContentSelectors: string[],
      private contextName: string|null, private templateName: string|null,
      private pipes: Map<string, CompilePipeSummary>, private viewQueries: CompileQueryMetadata[]) {
    this._valueConverter = new ValueConverter(
        outputCtx, () => this.allocateDataSlot(), (name, localName, slot, value) => {
          bindingScope.set(localName, value);
          const pipe = pipes.get(name) !;
          pipe || error(`Could not find pipe ${name}`);
          const pipeDefinition = constantPool.getDefinition(
              pipe.type.reference, DefinitionKind.Pipe, outputCtx, /* forceShared */ true);
          this._creationMode.push(
              o.importExpr(R3.pipe)
                  .callFn([
                    o.literal(slot), pipeDefinition, pipeDefinition.callMethod(R3.NEW_METHOD, [])
                  ])
                  .toStmt());
        });
  }

  buildTemplateFunction(asts: TemplateAst[], variables: VariableAst[]): o.FunctionExpr {
    // Create variable bindings
    for (const variable of variables) {
      const variableName = variable.name;
      const expression =
          o.variable(this.contextParameter).prop(variable.value || IMPLICIT_REFERENCE);
      const scopedName = this.bindingScope.freshReferenceName();
      const declaration = o.variable(scopedName).set(expression).toDeclStmt(o.INFERRED_TYPE, [
        o.StmtModifier.Final
      ]);

      // Add the reference to the local scope.
      this.bindingScope.set(variableName, o.variable(scopedName));

      // Declare the local variable in binding mode
      this._bindingMode.push(declaration);
    }

    // Collect content projections
    if (this.ngContentSelectors && this.ngContentSelectors.length > 0) {
      const contentProjections = getContentProjection(asts, this.ngContentSelectors);
      this._contentProjections = contentProjections;
      if (contentProjections.size > 0) {
        const infos: R3CssSelectorList[] = [];
        Array.from(contentProjections.values()).forEach(info => {
          if (info.selector) {
            infos[info.index - 1] = info.selector;
          }
        });
        const projectionIndex = this._projectionDefinitionIndex = this.allocateDataSlot();
        const parameters: o.Expression[] = [o.literal(projectionIndex)];
        !infos.some(value => !value) || error(`content project information skipped an index`);
        if (infos.length > 1) {
          parameters.push(this.outputCtx.constantPool.getConstLiteral(
              asLiteral(infos), /* forceShared */ true));
        }
        this.instruction(this._creationMode, null, R3.projectionDef, ...parameters);
      }
    }

    // Define and update any view queries
    for (let query of this.viewQueries) {
      // e.g. r3.Q(0, SomeDirective, true);
      const querySlot = this.allocateDataSlot();
      const predicate = getQueryPredicate(query, this.outputCtx);
      const args = [
        /* memoryIndex */ o.literal(querySlot, o.INFERRED_TYPE),
        /* predicate */ predicate,
        /* descend */ o.literal(query.descendants, o.INFERRED_TYPE)
      ];

      if (query.read) {
        args.push(this.outputCtx.importExpr(query.read.identifier !.reference));
      }
      this.instruction(this._creationMode, null, R3.query, ...args);

      // (r3.qR(tmp = r3.ɵld(0)) && (ctx.someDir = tmp));
      const temporary = this.temp();
      const getQueryList = o.importExpr(R3.load).callFn([o.literal(querySlot)]);
      const refresh = o.importExpr(R3.queryRefresh).callFn([temporary.set(getQueryList)]);
      const updateDirective = o.variable(CONTEXT_NAME)
                                  .prop(query.propertyName)
                                  .set(query.first ? temporary.prop('first') : temporary);
      this._bindingMode.push(refresh.and(updateDirective).toStmt());
    }

    templateVisitAll(this, asts);

    const creationMode = this._creationMode.length > 0 ?
        [o.ifStmt(o.variable(CREATION_MODE_FLAG), this._creationMode)] :
        [];

    // Generate maps of placeholder name to node indexes
    // TODO(vicb): This is a WIP, not fully supported yet
    for (const phToNodeIdx of this._phToNodeIdxes) {
      if (Object.keys(phToNodeIdx).length > 0) {
        const scopedName = this.bindingScope.freshReferenceName();
        const phMap = o.variable(scopedName)
                          .set(mapToExpression(phToNodeIdx, true))
                          .toDeclStmt(o.INFERRED_TYPE, [o.StmtModifier.Final]);

        this._prefix.push(phMap);
      }
    }

    return o.fn(
        [
          new o.FnParam(this.contextParameter, null), new o.FnParam(CREATION_MODE_FLAG, o.BOOL_TYPE)
        ],
        [
          // Temporary variable declarations (i.e. let _t: any;)
          ...this._prefix,
          // Creating mode (i.e. if (cm) { ... })
          ...creationMode,
          // Binding mode (i.e. ɵp(...))
          ...this._bindingMode,
          // Host mode (i.e. Comp.h(...))
          ...this._hostMode,
          // Refresh mode (i.e. Comp.r(...))
          ...this._refreshMode,
          // Nested templates (i.e. function CompTemplate() {})
          ...this._postfix
        ],
        o.INFERRED_TYPE, null, this.templateName);
  }

  // LocalResolver
  getLocal(name: string): o.Expression|null { return this.bindingScope.get(name); }

  // TemplateAstVisitor
  visitNgContent(ast: NgContentAst) {
    const info = this._contentProjections.get(ast) !;
    info || error(`Expected ${ast.sourceSpan} to be included in content projection collection`);
    const slot = this.allocateDataSlot();
    const parameters = [o.literal(slot), o.literal(this._projectionDefinitionIndex)];
    if (info.index !== 0) {
      parameters.push(o.literal(info.index));
    }
    this.instruction(this._creationMode, ast.sourceSpan, R3.projection, ...parameters);
  }

  private _computeDirectivesArray(directives: DirectiveAst[]) {
    const directiveIndexMap = new Map<any, number>();
    const directiveExpressions: o.Expression[] =
        directives.filter(directive => !directive.directive.isComponent).map(directive => {
          directiveIndexMap.set(directive.directive.type.reference, this.allocateDataSlot());
          return this.typeReference(directive.directive.type.reference);
        });
    return {
      directivesArray: directiveExpressions.length ?
          this.constantPool.getConstLiteral(
              o.literalArr(directiveExpressions), /* forceShared */ true) :
          o.literal(null),
      directiveIndexMap
    };
  }

  // TemplateAstVisitor
  visitElement(element: ElementAst) {
    const elementIndex = this.allocateDataSlot();
    let componentIndex: number|undefined = undefined;
    const referenceDataSlots = new Map<string, number>();
    const wasInI18nSection = this._inI18nSection;

    const outputAttrs: {[name: string]: string} = {};
    const attrI18nMetas: {[name: string]: string} = {};
    let i18nMeta: string = '';

    // Elements inside i18n sections are replaced with placeholders
    // TODO(vicb): nested elements are a WIP in this phase
    if (this._inI18nSection) {
      const phName = element.name.toLowerCase();
      if (!this._phToNodeIdxes[this._i18nSectionIndex][phName]) {
        this._phToNodeIdxes[this._i18nSectionIndex][phName] = [];
      }
      this._phToNodeIdxes[this._i18nSectionIndex][phName].push(elementIndex);
    }

    // Handle i18n attributes
    for (const attr of element.attrs) {
      const name = attr.name;
      const value = attr.value;
      if (name === I18N_ATTR) {
        if (this._inI18nSection) {
          throw new Error(
              `Could not mark an element as translatable inside of a translatable section`);
        }
        this._inI18nSection = true;
        this._i18nSectionIndex++;
        this._phToNodeIdxes[this._i18nSectionIndex] = {};
        i18nMeta = value;
      } else if (name.startsWith(I18N_ATTR_PREFIX)) {
        attrI18nMetas[name.slice(I18N_ATTR_PREFIX.length)] = value;
      } else {
        outputAttrs[name] = value;
      }
    }

    // Element creation mode
    const component = findComponent(element.directives);
    const nullNode = o.literal(null, o.INFERRED_TYPE);
    const parameters: o.Expression[] = [o.literal(elementIndex)];

    // Add component type or element tag
    if (component) {
      parameters.push(this.typeReference(component.directive.type.reference));
      componentIndex = this.allocateDataSlot();
    } else {
      parameters.push(o.literal(element.name));
    }

    // Add the attributes
    const i18nMessages: o.Statement[] = [];
    const attributes: o.Expression[] = [];
    let hasI18nAttr = false;

    Object.getOwnPropertyNames(outputAttrs).forEach(name => {
      const value = outputAttrs[name];
      attributes.push(o.literal(name));
      if (attrI18nMetas.hasOwnProperty(name)) {
        hasI18nAttr = true;
        const meta = parseI18nMeta(attrI18nMetas[name]);
        const variable = this.constantPool.getTranslation(value, meta);
        attributes.push(variable);
      } else {
        attributes.push(o.literal(value));
      }
    });

    let attrArg: o.Expression = nullNode;

    if (attributes.length > 0) {
      attrArg = hasI18nAttr ? getLiteralFactory(this.outputCtx, o.literalArr(attributes)) :
                              this.constantPool.getConstLiteral(o.literalArr(attributes), true);
    }

    parameters.push(attrArg);

    // Add directives array
    const {directivesArray, directiveIndexMap} = this._computeDirectivesArray(element.directives);
    parameters.push(directiveIndexMap.size > 0 ? directivesArray : nullNode);

    if (component && componentIndex != null) {
      // Record the data slot for the component
      directiveIndexMap.set(component.directive.type.reference, componentIndex);
    }

    if (element.references && element.references.length > 0) {
      const references =
          flatten(element.references.map(reference => {
            const slot = this.allocateDataSlot();
            referenceDataSlots.set(reference.name, slot);
            // Generate the update temporary.
            const variableName = this.bindingScope.freshReferenceName();
            this._bindingMode.push(o.variable(variableName, o.INFERRED_TYPE)
                                       .set(o.importExpr(R3.load).callFn([o.literal(slot)]))
                                       .toDeclStmt(o.INFERRED_TYPE, [o.StmtModifier.Final]));
            this.bindingScope.set(reference.name, o.variable(variableName));
            return [reference.name, reference.originalValue];
          })).map(value => o.literal(value));
      parameters.push(
          this.constantPool.getConstLiteral(o.literalArr(references), /* forceShared */ true));
    } else {
      parameters.push(nullNode);
    }

    // Remove trailing null nodes as they are implied.
    while (parameters[parameters.length - 1] === nullNode) {
      parameters.pop();
    }

    // Generate the instruction create element instruction
    if (i18nMessages.length > 0) {
      this._creationMode.push(...i18nMessages);
    }
    this.instruction(this._creationMode, element.sourceSpan, R3.createElement, ...parameters);

    const implicit = o.variable(this.contextParameter);

    // Generate element input bindings
    for (let input of element.inputs) {
      if (input.isAnimation) {
        this.unsupported('animations');
      }
      const convertedBinding = this.convertPropertyBinding(implicit, input.value);
      const instruction = BINDING_INSTRUCTION_MAP[input.type];
      if (instruction) {
        // TODO(chuckj): runtime: security context?
        this.instruction(
            this._bindingMode, input.sourceSpan, instruction, o.literal(elementIndex),
            o.literal(input.name), convertedBinding);
      } else {
        this.unsupported(`binding ${PropertyBindingType[input.type]}`);
      }
    }

    // Generate directives input bindings
    this._visitDirectives(element.directives, implicit, elementIndex, directiveIndexMap);

    // Traverse element child nodes
    if (this._inI18nSection && element.children.length == 1 &&
        element.children[0] instanceof TextAst) {
      const text = element.children[0] as TextAst;
      this.visitSingleI18nTextChild(text, i18nMeta);
    } else {
      templateVisitAll(this, element.children);
    }

    // Finish element construction mode.
    this.instruction(
        this._creationMode, element.endSourceSpan || element.sourceSpan, R3.elementEnd);

    // Restore the state before exiting this node
    this._inI18nSection = wasInI18nSection;
  }

  private _visitDirectives(
      directives: DirectiveAst[], implicit: o.Expression, nodeIndex: number,
      directiveIndexMap: Map<any, number>) {
    for (let directive of directives) {
      const directiveIndex = directiveIndexMap.get(directive.directive.type.reference);

      // Creation mode
      // e.g. D(0, TodoComponentDef.n(), TodoComponentDef);
      const directiveType = directive.directive.type.reference;
      const kind =
          directive.directive.isComponent ? DefinitionKind.Component : DefinitionKind.Directive;

      // Note: *do not cache* calls to this.directiveOf() as the constant pool needs to know if the
      // node is referenced multiple times to know that it must generate the reference into a
      // temporary.

      // Bindings
      for (const input of directive.inputs) {
        const convertedBinding = this.convertPropertyBinding(implicit, input.value);
        this.instruction(
            this._bindingMode, directive.sourceSpan, R3.elementProperty, o.literal(nodeIndex),
            o.literal(input.templateName), o.importExpr(R3.bind).callFn([convertedBinding]));
      }

      // e.g. MyDirective.ngDirectiveDef.h(0, 0);
      this._hostMode.push(
          this.definitionOf(directiveType, kind)
              .callMethod(R3.HOST_BINDING_METHOD, [o.literal(directiveIndex), o.literal(nodeIndex)])
              .toStmt());

      // e.g. r(0, 0);
      this.instruction(
          this._refreshMode, directive.sourceSpan, R3.refreshComponent, o.literal(directiveIndex),
          o.literal(nodeIndex));
    }
  }

  // TemplateAstVisitor
  visitEmbeddedTemplate(ast: EmbeddedTemplateAst) {
    const templateIndex = this.allocateDataSlot();

    const templateRef = this.reflector.resolveExternalReference(Identifiers.TemplateRef);
    const templateDirective = ast.directives.find(
        directive => directive.directive.type.diDeps.some(
            dependency =>
                dependency.token != null && (tokenReference(dependency.token) == templateRef)));
    const contextName =
        this.contextName && templateDirective && templateDirective.directive.type.reference.name ?
        `${this.contextName}_${templateDirective.directive.type.reference.name}` :
        null;
    const templateName =
        contextName ? `${contextName}_Template_${templateIndex}` : `Template_${templateIndex}`;
    const templateContext = `ctx${this.level}`;

    const {directivesArray, directiveIndexMap} = this._computeDirectivesArray(ast.directives);

    // e.g. C(1, C1Template)
    this.instruction(
        this._creationMode, ast.sourceSpan, R3.containerCreate, o.literal(templateIndex),
        directivesArray, o.variable(templateName));

    // e.g. Cr(1)
    this.instruction(
        this._refreshMode, ast.sourceSpan, R3.containerRefreshStart, o.literal(templateIndex));

    // Generate directives
    this._visitDirectives(
        ast.directives, o.variable(this.contextParameter), templateIndex, directiveIndexMap);

    // e.g. cr();
    this.instruction(this._refreshMode, ast.sourceSpan, R3.containerRefreshEnd);

    // Create the template function
    const templateVisitor = new TemplateDefinitionBuilder(
        this.outputCtx, this.constantPool, this.reflector, templateContext,
        this.bindingScope.nestedScope(), this.level + 1, this.ngContentSelectors, contextName,
        templateName, this.pipes, []);
    const templateFunctionExpr = templateVisitor.buildTemplateFunction(ast.children, ast.variables);
    this._postfix.push(templateFunctionExpr.toDeclStmt(templateName, null));
  }

  // These should be handled in the template or element directly.
  readonly visitReference = invalid;
  readonly visitVariable = invalid;
  readonly visitEvent = invalid;
  readonly visitElementProperty = invalid;
  readonly visitAttr = invalid;

  // TemplateAstVisitor
  visitBoundText(ast: BoundTextAst) {
    const nodeIndex = this.allocateDataSlot();

    // Creation mode
    this.instruction(this._creationMode, ast.sourceSpan, R3.text, o.literal(nodeIndex));

    // Refresh mode
    this.instruction(
        this._refreshMode, ast.sourceSpan, R3.textCreateBound, o.literal(nodeIndex),
        this.bind(o.variable(CONTEXT_NAME), ast.value, ast.sourceSpan));
  }

  // TemplateAstVisitor
  visitText(ast: TextAst) {
    // Text is defined in creation mode only.
    this.instruction(
        this._creationMode, ast.sourceSpan, R3.text, o.literal(this.allocateDataSlot()),
        o.literal(ast.value));
  }

  // When the content of the element is a single text node the translation can be inlined:
  //
  // `<p i18n="desc|mean">some content</p>`
  // compiles to
  // ```
  // /**
  // * @desc desc
  // * @meaning mean
  // */
  // const MSG_XYZ = goog.getMsg('some content');
  // i0.ɵT(1, MSG_XYZ);
  // ```
  visitSingleI18nTextChild(text: TextAst, i18nMeta: string) {
    const meta = parseI18nMeta(i18nMeta);
    const variable = this.constantPool.getTranslation(text.value, meta);
    this.instruction(
        this._creationMode, text.sourceSpan, R3.text, o.literal(this.allocateDataSlot()), variable);
  }

  // These should be handled in the template or element directly
  readonly visitDirective = invalid;
  readonly visitDirectiveProperty = invalid;

  private allocateDataSlot() { return this._dataIndex++; }
  private bindingContext() { return `${this._bindingContext++}`; }

  private instruction(
      statements: o.Statement[], span: ParseSourceSpan|null, reference: o.ExternalReference,
      ...params: o.Expression[]) {
    statements.push(o.importExpr(reference, null, span).callFn(params, span).toStmt());
  }

  private typeReference(type: any): o.Expression { return this.outputCtx.importExpr(type); }

  private definitionOf(type: any, kind: DefinitionKind): o.Expression {
    return this.constantPool.getDefinition(type, kind, this.outputCtx);
  }

  private temp(): o.ReadVarExpr {
    if (!this._temporaryAllocated) {
      this._prefix.push(new o.DeclareVarStmt(TEMPORARY_NAME, undefined, o.DYNAMIC_TYPE));
      this._temporaryAllocated = true;
    }
    return o.variable(TEMPORARY_NAME);
  }

  private convertPropertyBinding(implicit: o.Expression, value: AST): o.Expression {
    const pipesConvertedValue = value.visit(this._valueConverter);
    const convertedPropertyBinding = convertPropertyBinding(
        this, implicit, pipesConvertedValue, this.bindingContext(), BindingForm.TrySimple,
        interpolate);
    this._refreshMode.push(...convertedPropertyBinding.stmts);
    return convertedPropertyBinding.currValExpr;
  }

  private bind(implicit: o.Expression, value: AST, sourceSpan: ParseSourceSpan): o.Expression {
    return this.convertPropertyBinding(implicit, value);
  }
}

function getQueryPredicate(query: CompileQueryMetadata, outputCtx: OutputContext): o.Expression {
  let predicate: o.Expression;
  if (query.selectors.length > 1 || (query.selectors.length == 1 && query.selectors[0].value)) {
    const selectors = query.selectors.map(value => value.value as string);
    selectors.some(value => !value) && error('Found a type among the string selectors expected');
    predicate = outputCtx.constantPool.getConstLiteral(
        o.literalArr(selectors.map(value => o.literal(value))));
  } else if (query.selectors.length == 1) {
    const first = query.selectors[0];
    if (first.identifier) {
      predicate = outputCtx.importExpr(first.identifier.reference);
    } else {
      error('Unexpected query form');
      predicate = o.literal(null);
    }
  } else {
    error('Unexpected query form');
    predicate = o.literal(null);
  }
  return predicate;
}

export function createFactory(
    type: CompileTypeMetadata, outputCtx: OutputContext, reflector: CompileReflector,
    queries: CompileQueryMetadata[]): o.Expression {
  let args: o.Expression[] = [];

  const elementRef = reflector.resolveExternalReference(Identifiers.ElementRef);
  const templateRef = reflector.resolveExternalReference(Identifiers.TemplateRef);
  const viewContainerRef = reflector.resolveExternalReference(Identifiers.ViewContainerRef);

  for (let dependency of type.diDeps) {
    if (dependency.isValue) {
      unsupported('value dependencies');
    }
    if (dependency.isHost) {
      unsupported('host dependencies');
    }
    const token = dependency.token;
    if (token) {
      const tokenRef = tokenReference(token);
      if (tokenRef === elementRef) {
        args.push(o.importExpr(R3.injectElementRef).callFn([]));
      } else if (tokenRef === templateRef) {
        args.push(o.importExpr(R3.injectTemplateRef).callFn([]));
      } else if (tokenRef === viewContainerRef) {
        args.push(o.importExpr(R3.injectViewContainerRef).callFn([]));
      } else {
        const value =
            token.identifier != null ? outputCtx.importExpr(tokenRef) : o.literal(tokenRef);
        args.push(o.importExpr(R3.inject).callFn([value]));
      }
    } else {
      unsupported('dependency without a token');
    }
  }

  const queryDefinitions: o.Expression[] = [];
  for (let query of queries) {
    const predicate = getQueryPredicate(query, outputCtx);

    // e.g. r3.Q(null, SomeDirective, false) or r3.Q(null, ['div'], false)
    const parameters = [
      /* memoryIndex */ o.literal(null, o.INFERRED_TYPE),
      /* predicate */ predicate,
      /* descend */ o.literal(query.descendants)
    ];

    if (query.read) {
      parameters.push(outputCtx.importExpr(query.read.identifier !.reference));
    }

    queryDefinitions.push(o.importExpr(R3.query).callFn(parameters));
  }

  const createInstance = new o.InstantiateExpr(outputCtx.importExpr(type.reference), args);
  const result = queryDefinitions.length > 0 ? o.literalArr([createInstance, ...queryDefinitions]) :
                                               createInstance;

  return o.fn(
      [], [new o.ReturnStatement(result)], o.INFERRED_TYPE, null,
      type.reference.name ? `${type.reference.name}_Factory` : null);
}

type HostBindings = {
  [key: string]: string
};

// Turn a directive selector into an R3-compatible selector for directive def
function createDirectiveSelector(selector: string): o.Expression {
  return asLiteral(parseSelectorsToR3Selector(CssSelector.parse(selector)));
}

function createHostAttributesArray(
    directiveMetadata: CompileDirectiveMetadata, outputCtx: OutputContext): o.Expression|null {
  const values: o.Expression[] = [];
  const attributes = directiveMetadata.hostAttributes;
  for (let key of Object.getOwnPropertyNames(attributes)) {
    const value = attributes[key];
    values.push(o.literal(key), o.literal(value));
  }
  if (values.length > 0) {
    return outputCtx.constantPool.getConstLiteral(o.literalArr(values));
  }
  return null;
}

// Return a host binding function or null if one is not necessary.
function createHostBindingsFunction(
    directiveMetadata: CompileDirectiveMetadata, outputCtx: OutputContext,
    bindingParser: BindingParser): o.Expression|null {
  const statements: o.Statement[] = [];

  const temporary = function() {
    let declared = false;
    return () => {
      if (!declared) {
        statements.push(new o.DeclareVarStmt(TEMPORARY_NAME, undefined, o.DYNAMIC_TYPE));
        declared = true;
      }
      return o.variable(TEMPORARY_NAME);
    };
  }();

  const hostBindingSourceSpan = typeSourceSpan(
      directiveMetadata.isComponent ? 'Component' : 'Directive', directiveMetadata.type);

  // Calculate the queries
  for (let index = 0; index < directiveMetadata.queries.length; index++) {
    const query = directiveMetadata.queries[index];

    // e.g. r3.qR(tmp = r3.ld(dirIndex)[1]) && (r3.ld(dirIndex)[0].someDir = tmp);
    const getDirectiveMemory = o.importExpr(R3.load).callFn([o.variable('dirIndex')]);
    // The query list is at the query index + 1 because the directive itself is in slot 0.
    const getQueryList = getDirectiveMemory.key(o.literal(index + 1));
    const assignToTemporary = temporary().set(getQueryList);
    const callQueryRefresh = o.importExpr(R3.queryRefresh).callFn([assignToTemporary]);
    const updateDirective = getDirectiveMemory.key(o.literal(0, o.INFERRED_TYPE))
                                .prop(query.propertyName)
                                .set(query.first ? temporary().prop('first') : temporary());
    const andExpression = callQueryRefresh.and(updateDirective);
    statements.push(andExpression.toStmt());
  }

  const directiveSummary = directiveMetadata.toSummary();

  // Calculate the host property bindings
  const bindings = bindingParser.createBoundHostProperties(directiveSummary, hostBindingSourceSpan);
  const bindingContext = o.importExpr(R3.load).callFn([o.variable('dirIndex')]);
  if (bindings) {
    for (const binding of bindings) {
      const bindingExpr = convertPropertyBinding(
          null, bindingContext, binding.expression, 'b', BindingForm.TrySimple,
          () => error('Unexpected interpolation'));
      statements.push(...bindingExpr.stmts);
      statements.push(o.importExpr(R3.elementProperty)
                          .callFn([
                            o.variable('elIndex'), o.literal(binding.name),
                            o.importExpr(R3.bind).callFn([bindingExpr.currValExpr])
                          ])
                          .toStmt());
    }
  }

  // Calculate host event bindings
  const eventBindings =
      bindingParser.createDirectiveHostEventAsts(directiveSummary, hostBindingSourceSpan);
  if (eventBindings) {
    for (const binding of eventBindings) {
      const bindingExpr = convertActionBinding(
          null, bindingContext, binding.handler, 'b', () => error('Unexpected interpolation'));
      const bindingName = binding.name && sanitizeIdentifier(binding.name);
      const typeName = identifierName(directiveMetadata.type);
      const functionName =
          typeName && bindingName ? `${typeName}_${bindingName}_HostBindingHandler` : null;
      const handler = o.fn(
          [new o.FnParam('event', o.DYNAMIC_TYPE)],
          [...bindingExpr.stmts, new o.ReturnStatement(bindingExpr.allowDefault)], o.INFERRED_TYPE,
          null, functionName);
      statements.push(
          o.importExpr(R3.listener).callFn([o.literal(binding.name), handler]).toStmt());
    }
  }


  if (statements.length > 0) {
    const typeName = directiveMetadata.type.reference.name;
    return o.fn(
        [new o.FnParam('dirIndex', o.NUMBER_TYPE), new o.FnParam('elIndex', o.NUMBER_TYPE)],
        statements, o.INFERRED_TYPE, null, typeName ? `${typeName}_HostBindings` : null);
  }

  return null;
}

function createInputsObject(
    directive: CompileDirectiveMetadata, outputCtx: OutputContext): o.Expression|null {
  if (Object.getOwnPropertyNames(directive.inputs).length > 0) {
    return outputCtx.constantPool.getConstLiteral(mapToExpression(directive.inputs));
  }
  return null;
}

class ValueConverter extends AstMemoryEfficientTransformer {
  private pipeSlots = new Map<string, number>();
  constructor(
      private outputCtx: OutputContext, private allocateSlot: () => number,
      private definePipe:
          (name: string, localName: string, slot: number, value: o.Expression) => void) {
    super();
  }

  // AstMemoryEfficientTransformer
  visitPipe(ast: BindingPipe, context: any): AST {
    // Allocate a slot to create the pipe
    let slot = this.pipeSlots.get(ast.name);
    if (slot == null) {
      slot = this.allocateSlot();
      this.pipeSlots.set(ast.name, slot);
    }
    const slotPseudoLocal = `PIPE:${slot}`;
    const target = new PropertyRead(ast.span, new ImplicitReceiver(ast.span), slotPseudoLocal);
    const bindingId = pipeBinding(ast.args);
    this.definePipe(ast.name, slotPseudoLocal, slot, o.importExpr(bindingId));
    const value = ast.exp.visit(this);
    const args = this.visitAll(ast.args);

    return new FunctionCall(
        ast.span, target, [new LiteralPrimitive(ast.span, slot), value, ...args]);
  }

  visitLiteralArray(ast: LiteralArray, context: any): AST {
    return new BuiltinFunctionCall(ast.span, this.visitAll(ast.expressions), values => {
      // If the literal has calculated (non-literal) elements transform it into
      // calls to literal factories that compose the literal and will cache intermediate
      // values. Otherwise, just return an literal array that contains the values.
      const literal = o.literalArr(values);
      return values.every(a => a.isConstant()) ?
          this.outputCtx.constantPool.getConstLiteral(literal, true) :
          getLiteralFactory(this.outputCtx, literal);
    });
  }

  visitLiteralMap(ast: LiteralMap, context: any): AST {
    return new BuiltinFunctionCall(ast.span, this.visitAll(ast.values), values => {
      // If the literal has calculated (non-literal) elements  transform it into
      // calls to literal factories that compose the literal and will cache intermediate
      // values. Otherwise, just return an literal array that contains the values.
      const literal = o.literalMap(values.map(
          (value, index) => ({key: ast.keys[index].key, value, quoted: ast.keys[index].quoted})));
      return values.every(a => a.isConstant()) ?
          this.outputCtx.constantPool.getConstLiteral(literal, true) :
          getLiteralFactory(this.outputCtx, literal);
    });
  }
}

function invalid<T>(arg: o.Expression | o.Statement | TemplateAst): never {
  throw new Error(
      `Invalid state: Visitor ${this.constructor.name} doesn't handle ${o.constructor.name}`);
}

function findComponent(directives: DirectiveAst[]): DirectiveAst|undefined {
  return directives.filter(directive => directive.directive.isComponent)[0];
}

interface NgContentInfo {
  index: number;
  selector?: R3CssSelectorList;
}

class ContentProjectionVisitor extends RecursiveTemplateAstVisitor {
  private index = 1;
  constructor(
      private projectionMap: Map<NgContentAst, NgContentInfo>,
      private ngContentSelectors: string[]) {
    super();
  }

  visitNgContent(ast: NgContentAst) {
    const selectorText = this.ngContentSelectors[ast.index];
    selectorText != null || error(`could not find selector for index ${ast.index} in ${ast}`);
    if (!selectorText || selectorText === '*') {
      this.projectionMap.set(ast, {index: 0});
    } else {
      const cssSelectors = CssSelector.parse(selectorText);
      this.projectionMap.set(
          ast, {index: this.index++, selector: parseSelectorsToR3Selector(cssSelectors)});
    }
  }
}

function getContentProjection(asts: TemplateAst[], ngContentSelectors: string[]) {
  const projectIndexMap = new Map<NgContentAst, NgContentInfo>();
  const visitor = new ContentProjectionVisitor(projectIndexMap, ngContentSelectors);
  templateVisitAll(visitor, asts);
  return projectIndexMap;
}


/**
 * Flags used to generate R3-style CSS Selectors. They are pasted from
 * core/src/render3/projection.ts because they cannot be referenced directly.
 */
const enum SelectorFlags {
  /** Indicates this is the beginning of a new negative selector */
  NOT = 0b0001,

  /** Mode for matching attributes */
  ATTRIBUTE = 0b0010,

  /** Mode for matching tag names */
  ELEMENT = 0b0100,

  /** Mode for matching class names */
  CLASS = 0b1000,
}

// These are a copy the CSS types from core/src/render3/interfaces/projection.ts
// They are duplicated here as they cannot be directly referenced from core.
type R3CssSelector = (string | SelectorFlags)[];
type R3CssSelectorList = R3CssSelector[];

function parserSelectorToSimpleSelector(selector: CssSelector): R3CssSelector {
  const classes = selector.classNames && selector.classNames.length ?
      [SelectorFlags.CLASS, ...selector.classNames] :
      [];
  const elementName = selector.element && selector.element !== '*' ? selector.element : '';
  return [elementName, ...selector.attrs, ...classes];
}

function parserSelectorToNegativeSelector(selector: CssSelector): R3CssSelector {
  const classes = selector.classNames && selector.classNames.length ?
      [SelectorFlags.CLASS, ...selector.classNames] :
      [];

  if (selector.element) {
    return [
      SelectorFlags.NOT | SelectorFlags.ELEMENT, selector.element, ...selector.attrs, ...classes
    ];
  } else if (selector.attrs.length) {
    return [SelectorFlags.NOT | SelectorFlags.ATTRIBUTE, ...selector.attrs, ...classes];
  } else {
    return selector.classNames && selector.classNames.length ?
        [SelectorFlags.NOT | SelectorFlags.CLASS, ...selector.classNames] :
        [];
  }
}

function parserSelectorToR3Selector(selector: CssSelector): R3CssSelector {
  const positive = parserSelectorToSimpleSelector(selector);

  const negative: R3CssSelectorList = selector.notSelectors && selector.notSelectors.length ?
      selector.notSelectors.map(notSelector => parserSelectorToNegativeSelector(notSelector)) :
      [];

  return positive.concat(...negative);
}

function parseSelectorsToR3Selector(selectors: CssSelector[]): R3CssSelectorList {
  return selectors.map(parserSelectorToR3Selector);
}

function asLiteral(value: any): o.Expression {
  if (Array.isArray(value)) {
    return o.literalArr(value.map(asLiteral));
  }
  return o.literal(value, o.INFERRED_TYPE);
}

function mapToExpression(map: {[key: string]: any}, quoted = false): o.Expression {
  return o.literalMap(
      Object.getOwnPropertyNames(map).map(key => ({key, quoted, value: asLiteral(map[key])})));
}

// Parse i18n metas like:
// - "@@id",
// - "description[@@id]",
// - "meaning|description[@@id]"
function parseI18nMeta(i18n?: string): {description?: string, id?: string, meaning?: string} {
  let meaning: string|undefined;
  let description: string|undefined;
  let id: string|undefined;

  if (i18n) {
    // TODO(vicb): figure out how to force a message ID with closure ?
    const idIndex = i18n.indexOf(ID_SEPARATOR);

    const descIndex = i18n.indexOf(MEANING_SEPARATOR);
    let meaningAndDesc: string;
    [meaningAndDesc, id] =
        (idIndex > -1) ? [i18n.slice(0, idIndex), i18n.slice(idIndex + 2)] : [i18n, ''];
    [meaning, description] = (descIndex > -1) ?
        [meaningAndDesc.slice(0, descIndex), meaningAndDesc.slice(descIndex + 1)] :
        ['', meaningAndDesc];
  }

  return {description, id, meaning};
}
