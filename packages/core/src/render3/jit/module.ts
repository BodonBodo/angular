/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {R3InjectorMetadataFacade, getCompilerFacade} from '../../compiler/compiler_facade';
import {resolveForwardRef} from '../../di/forward_ref';
import {NG_INJ_DEF} from '../../di/interface/defs';
import {reflectDependencies} from '../../di/jit/util';
import {Type} from '../../interface/type';
import {Component} from '../../metadata';
import {ModuleWithProviders, NgModule, NgModuleDef, NgModuleTransitiveScopes} from '../../metadata/ng_module';
import {deepForEach, flatten} from '../../util/array_utils';
import {assertDefined} from '../../util/assert';
import {getComponentDef, getDirectiveDef, getNgModuleDef, getPipeDef} from '../definition';
import {NG_COMP_DEF, NG_DIR_DEF, NG_MOD_DEF, NG_PIPE_DEF} from '../fields';
import {ComponentDef} from '../interfaces/definition';
import {NgModuleType} from '../ng_module_ref';
import {maybeUnwrapFn, stringifyForError} from '../util/misc_utils';

import {angularCoreEnv} from './environment';

const EMPTY_ARRAY: Type<any>[] = [];

interface ModuleQueueItem {
  moduleType: Type<any>;
  ngModule: NgModule;
}

const moduleQueue: ModuleQueueItem[] = [];

/**
 * Enqueues moduleDef to be checked later to see if scope can be set on its
 * component declarations.
 */
function enqueueModuleForDelayedScoping(moduleType: Type<any>, ngModule: NgModule) {
  moduleQueue.push({moduleType, ngModule});
}

let flushingModuleQueue = false;
/**
 * Loops over queued module definitions, if a given module definition has all of its
 * declarations resolved, it dequeues that module definition and sets the scope on
 * its declarations.
 */
export function flushModuleScopingQueueAsMuchAsPossible() {
  if (!flushingModuleQueue) {
    flushingModuleQueue = true;
    try {
      for (let i = moduleQueue.length - 1; i >= 0; i--) {
        const {moduleType, ngModule} = moduleQueue[i];

        if (ngModule.declarations && ngModule.declarations.every(isResolvedDeclaration)) {
          // dequeue
          moduleQueue.splice(i, 1);
          setScopeOnDeclaredComponents(moduleType, ngModule);
        }
      }
    } finally {
      flushingModuleQueue = false;
    }
  }
}

/**
 * Returns truthy if a declaration has resolved. If the declaration happens to be
 * an array of declarations, it will recurse to check each declaration in that array
 * (which may also be arrays).
 */
function isResolvedDeclaration(declaration: any[] | Type<any>): boolean {
  if (Array.isArray(declaration)) {
    return declaration.every(isResolvedDeclaration);
  }
  return !!resolveForwardRef(declaration);
}

/**
 * Compiles a module in JIT mode.
 *
 * This function automatically gets called when a class has a `@NgModule` decorator.
 */
export function compileNgModule(moduleType: Type<any>, ngModule: NgModule = {}): void {
  compileNgModuleDefs(moduleType as NgModuleType, ngModule);

  // Because we don't know if all declarations have resolved yet at the moment the
  // NgModule decorator is executing, we're enqueueing the setting of module scope
  // on its declarations to be run at a later time when all declarations for the module,
  // including forward refs, have resolved.
  enqueueModuleForDelayedScoping(moduleType, ngModule);
}

/**
 * Compiles and adds the `ɵmod` and `ɵinj` properties to the module class.
 *
 * It's possible to compile a module via this API which will allow duplicate declarations in its
 * root.
 */
export function compileNgModuleDefs(
    moduleType: NgModuleType, ngModule: NgModule,
    allowDuplicateDeclarationsInRoot: boolean = false): void {
  ngDevMode && assertDefined(moduleType, 'Required value moduleType');
  ngDevMode && assertDefined(ngModule, 'Required value ngModule');
  const declarations: Type<any>[] = flatten(ngModule.declarations || EMPTY_ARRAY);
  let ngModuleDef: any = null;
  Object.defineProperty(moduleType, NG_MOD_DEF, {
    configurable: true,
    get: () => {
      if (ngModuleDef === null) {
        if (ngDevMode && ngModule.imports && ngModule.imports.indexOf(moduleType) > -1) {
          // We need to assert this immediately, because allowing it to continue will cause it to
          // go into an infinite loop before we've reached the point where we throw all the errors.
          throw new Error(`'${stringifyForError(moduleType)}' module can't import itself`);
        }
        ngModuleDef = getCompilerFacade().compileNgModule(
            angularCoreEnv, `ng:///${moduleType.name}/ɵmod.js`, {
              type: moduleType,
              bootstrap: flatten(ngModule.bootstrap || EMPTY_ARRAY).map(resolveForwardRef),
              declarations: declarations.map(resolveForwardRef),
              imports: flatten(ngModule.imports || EMPTY_ARRAY)
                           .map(resolveForwardRef)
                           .map(expandModuleWithProviders),
              exports: flatten(ngModule.exports || EMPTY_ARRAY)
                           .map(resolveForwardRef)
                           .map(expandModuleWithProviders),
              schemas: ngModule.schemas ? flatten(ngModule.schemas) : null,
              id: ngModule.id || null,
            });
        // Set `schemas` on ngModuleDef to an empty array in JIT mode to indicate that runtime
        // should verify that there are no unknown elements in a template. In AOT mode, that check
        // happens at compile time and `schemas` information is not present on Component and Module
        // defs after compilation (so the check doesn't happen the second time at runtime).
        if (!ngModuleDef.schemas) {
          ngModuleDef.schemas = [];
        }
      }
      return ngModuleDef;
    }
  });

  let ngInjectorDef: any = null;
  Object.defineProperty(moduleType, NG_INJ_DEF, {
    get: () => {
      if (ngInjectorDef === null) {
        ngDevMode && verifySemanticsOfNgModuleDef(
                         moduleType as any as NgModuleType, allowDuplicateDeclarationsInRoot);
        const meta: R3InjectorMetadataFacade = {
          name: moduleType.name,
          type: moduleType,
          deps: reflectDependencies(moduleType),
          providers: ngModule.providers || EMPTY_ARRAY,
          imports: [
            (ngModule.imports || EMPTY_ARRAY).map(resolveForwardRef),
            (ngModule.exports || EMPTY_ARRAY).map(resolveForwardRef),
          ],
        };
        ngInjectorDef = getCompilerFacade().compileInjector(
            angularCoreEnv, `ng:///${moduleType.name}/ɵinj.js`, meta);
      }
      return ngInjectorDef;
    },
    // Make the property configurable in dev mode to allow overriding in tests
    configurable: !!ngDevMode,
  });
}

function verifySemanticsOfNgModuleDef(
    moduleType: NgModuleType, allowDuplicateDeclarationsInRoot: boolean,
    importingModule?: NgModuleType): void {
  if (verifiedNgModule.get(moduleType)) return;
  verifiedNgModule.set(moduleType, true);
  moduleType = resolveForwardRef(moduleType);
  let ngModuleDef: NgModuleDef<any>;
  if (importingModule) {
    ngModuleDef = getNgModuleDef(moduleType) !;
    if (!ngModuleDef) {
      throw new Error(
          `Unexpected value '${moduleType.name}' imported by the module '${importingModule.name}'. Please add an @NgModule annotation.`);
    }
  } else {
    ngModuleDef = getNgModuleDef(moduleType, true);
  }
  const errors: string[] = [];
  const declarations = maybeUnwrapFn(ngModuleDef.declarations);
  const imports = maybeUnwrapFn(ngModuleDef.imports);
  flatten(imports).map(unwrapModuleWithProvidersImports).forEach(mod => {
    verifySemanticsOfNgModuleImport(mod, moduleType);
    verifySemanticsOfNgModuleDef(mod, false, moduleType);
  });
  const exports = maybeUnwrapFn(ngModuleDef.exports);
  declarations.forEach(verifyDeclarationsHaveDefinitions);
  declarations.forEach(verifyDirectivesHaveSelector);
  const combinedDeclarations: Type<any>[] = [
    ...declarations.map(resolveForwardRef),
    ...flatten(imports.map(computeCombinedExports)).map(resolveForwardRef),
  ];
  exports.forEach(verifyExportsAreDeclaredOrReExported);
  declarations.forEach(decl => verifyDeclarationIsUnique(decl, allowDuplicateDeclarationsInRoot));
  declarations.forEach(verifyComponentEntryComponentsIsPartOfNgModule);

  const ngModule = getAnnotation<NgModule>(moduleType, 'NgModule');
  if (ngModule) {
    ngModule.imports &&
        flatten(ngModule.imports).map(unwrapModuleWithProvidersImports).forEach(mod => {
          verifySemanticsOfNgModuleImport(mod, moduleType);
          verifySemanticsOfNgModuleDef(mod, false, moduleType);
        });
    ngModule.bootstrap && deepForEach(ngModule.bootstrap, verifyCorrectBootstrapType);
    ngModule.bootstrap && deepForEach(ngModule.bootstrap, verifyComponentIsPartOfNgModule);
    ngModule.entryComponents &&
        deepForEach(ngModule.entryComponents, verifyComponentIsPartOfNgModule);
  }

  // Throw Error if any errors were detected.
  if (errors.length) {
    throw new Error(errors.join('\n'));
  }
  ////////////////////////////////////////////////////////////////////////////////////////////////
  function verifyDeclarationsHaveDefinitions(type: Type<any>): void {
    type = resolveForwardRef(type);
    const def = getComponentDef(type) || getDirectiveDef(type) || getPipeDef(type);
    if (!def) {
      errors.push(
          `Unexpected value '${stringifyForError(type)}' declared by the module '${stringifyForError(moduleType)}'. Please add a @Pipe/@Directive/@Component annotation.`);
    }
  }

  function verifyDirectivesHaveSelector(type: Type<any>): void {
    type = resolveForwardRef(type);
    const def = getDirectiveDef(type);
    if (!getComponentDef(type) && def && def.selectors.length == 0) {
      errors.push(`Directive ${stringifyForError(type)} has no selector, please add it!`);
    }
  }

  function verifyExportsAreDeclaredOrReExported(type: Type<any>) {
    type = resolveForwardRef(type);
    const kind = getComponentDef(type) && 'component' || getDirectiveDef(type) && 'directive' ||
        getPipeDef(type) && 'pipe';
    if (kind) {
      // only checked if we are declared as Component, Directive, or Pipe
      // Modules don't need to be declared or imported.
      if (combinedDeclarations.lastIndexOf(type) === -1) {
        // We are exporting something which we don't explicitly declare or import.
        errors.push(
            `Can't export ${kind} ${stringifyForError(type)} from ${stringifyForError(moduleType)} as it was neither declared nor imported!`);
      }
    }
  }

  function verifyDeclarationIsUnique(type: Type<any>, suppressErrors: boolean) {
    type = resolveForwardRef(type);
    const existingModule = ownerNgModule.get(type);
    if (existingModule && existingModule !== moduleType) {
      if (!suppressErrors) {
        const modules = [existingModule, moduleType].map(stringifyForError).sort();
        errors.push(
            `Type ${stringifyForError(type)} is part of the declarations of 2 modules: ${modules[0]} and ${modules[1]}! ` +
            `Please consider moving ${stringifyForError(type)} to a higher module that imports ${modules[0]} and ${modules[1]}. ` +
            `You can also create a new NgModule that exports and includes ${stringifyForError(type)} then import that NgModule in ${modules[0]} and ${modules[1]}.`);
      }
    } else {
      // Mark type as having owner.
      ownerNgModule.set(type, moduleType);
    }
  }

  function verifyComponentIsPartOfNgModule(type: Type<any>) {
    type = resolveForwardRef(type);
    const existingModule = ownerNgModule.get(type);
    if (!existingModule) {
      errors.push(
          `Component ${stringifyForError(type)} is not part of any NgModule or the module has not been imported into your module.`);
    }
  }

  function verifyCorrectBootstrapType(type: Type<any>) {
    type = resolveForwardRef(type);
    if (!getComponentDef(type)) {
      errors.push(`${stringifyForError(type)} cannot be used as an entry component.`);
    }
  }

  function verifyComponentEntryComponentsIsPartOfNgModule(type: Type<any>) {
    type = resolveForwardRef(type);
    if (getComponentDef(type)) {
      // We know we are component
      const component = getAnnotation<Component>(type, 'Component');
      if (component && component.entryComponents) {
        deepForEach(component.entryComponents, verifyComponentIsPartOfNgModule);
      }
    }
  }

  function verifySemanticsOfNgModuleImport(type: Type<any>, importingModule: Type<any>) {
    type = resolveForwardRef(type);

    if (getComponentDef(type) || getDirectiveDef(type)) {
      throw new Error(
          `Unexpected directive '${type.name}' imported by the module '${importingModule.name}'. Please add an @NgModule annotation.`);
    }

    if (getPipeDef(type)) {
      throw new Error(
          `Unexpected pipe '${type.name}' imported by the module '${importingModule.name}'. Please add an @NgModule annotation.`);
    }
  }
}

function unwrapModuleWithProvidersImports(
    typeOrWithProviders: NgModuleType<any>| {ngModule: NgModuleType<any>}): NgModuleType<any> {
  typeOrWithProviders = resolveForwardRef(typeOrWithProviders);
  return (typeOrWithProviders as any).ngModule || typeOrWithProviders;
}

function getAnnotation<T>(type: any, name: string): T|null {
  let annotation: T|null = null;
  collect(type.__annotations__);
  collect(type.decorators);
  return annotation;

  function collect(annotations: any[] | null) {
    if (annotations) {
      annotations.forEach(readAnnotation);
    }
  }

  function readAnnotation(
      decorator: {type: {prototype: {ngMetadataName: string}, args: any[]}, args: any}): void {
    if (!annotation) {
      const proto = Object.getPrototypeOf(decorator);
      if (proto.ngMetadataName == name) {
        annotation = decorator as any;
      } else if (decorator.type) {
        const proto = Object.getPrototypeOf(decorator.type);
        if (proto.ngMetadataName == name) {
          annotation = decorator.args[0];
        }
      }
    }
  }
}

/**
 * Keep track of compiled components. This is needed because in tests we often want to compile the
 * same component with more than one NgModule. This would cause an error unless we reset which
 * NgModule the component belongs to. We keep the list of compiled components here so that the
 * TestBed can reset it later.
 */
let ownerNgModule = new Map<Type<any>, NgModuleType<any>>();
let verifiedNgModule = new Map<NgModuleType<any>, boolean>();

export function resetCompiledComponents(): void {
  ownerNgModule = new Map<Type<any>, NgModuleType<any>>();
  verifiedNgModule = new Map<NgModuleType<any>, boolean>();
  moduleQueue.length = 0;
}

/**
 * Computes the combined declarations of explicit declarations, as well as declarations inherited by
 * traversing the exports of imported modules.
 * @param type
 */
function computeCombinedExports(type: Type<any>): Type<any>[] {
  type = resolveForwardRef(type);
  const ngModuleDef = getNgModuleDef(type, true);
  return [...flatten(maybeUnwrapFn(ngModuleDef.exports).map((type) => {
    const ngModuleDef = getNgModuleDef(type);
    if (ngModuleDef) {
      verifySemanticsOfNgModuleDef(type as any as NgModuleType, false);
      return computeCombinedExports(type);
    } else {
      return type;
    }
  }))];
}

/**
 * Some declared components may be compiled asynchronously, and thus may not have their
 * ɵcmp set yet. If this is the case, then a reference to the module is written into
 * the `ngSelectorScope` property of the declared type.
 */
function setScopeOnDeclaredComponents(moduleType: Type<any>, ngModule: NgModule) {
  const declarations: Type<any>[] = flatten(ngModule.declarations || EMPTY_ARRAY);

  const transitiveScopes = transitiveScopesFor(moduleType);

  declarations.forEach(declaration => {
    if (declaration.hasOwnProperty(NG_COMP_DEF)) {
      // A `ɵcmp` field exists - go ahead and patch the component directly.
      const component = declaration as Type<any>& {ɵcmp: ComponentDef<any>};
      const componentDef = getComponentDef(component) !;
      patchComponentDefWithScope(componentDef, transitiveScopes);
    } else if (
        !declaration.hasOwnProperty(NG_DIR_DEF) && !declaration.hasOwnProperty(NG_PIPE_DEF)) {
      // Set `ngSelectorScope` for future reference when the component compilation finishes.
      (declaration as Type<any>& {ngSelectorScope?: any}).ngSelectorScope = moduleType;
    }
  });
}

/**
 * Patch the definition of a component with directives and pipes from the compilation scope of
 * a given module.
 */
export function patchComponentDefWithScope<C>(
    componentDef: ComponentDef<C>, transitiveScopes: NgModuleTransitiveScopes) {
  componentDef.directiveDefs = () =>
      Array.from(transitiveScopes.compilation.directives)
          .map(
              dir =>
                  dir.hasOwnProperty(NG_COMP_DEF) ? getComponentDef(dir) ! : getDirectiveDef(dir) !)
          .filter(def => !!def);
  componentDef.pipeDefs = () =>
      Array.from(transitiveScopes.compilation.pipes).map(pipe => getPipeDef(pipe) !);
  componentDef.schemas = transitiveScopes.schemas;

  // Since we avoid Components/Directives/Pipes recompiling in case there are no overrides, we
  // may face a problem where previously compiled defs available to a given Component/Directive
  // are cached in TView and may become stale (in case any of these defs gets recompiled). In
  // order to avoid this problem, we force fresh TView to be created.
  componentDef.tView = null;
}

/**
 * Compute the pair of transitive scopes (compilation scope and exported scope) for a given module.
 *
 * This operation is memoized and the result is cached on the module's definition. This function can
 * be called on modules with components that have not fully compiled yet, but the result should not
 * be used until they have.
 *
 * @param moduleType module that transitive scope should be calculated for.
 */
export function transitiveScopesFor<T>(moduleType: Type<T>): NgModuleTransitiveScopes {
  if (!isNgModule(moduleType)) {
    throw new Error(`${moduleType.name} does not have a module def (ɵmod property)`);
  }
  const def = getNgModuleDef(moduleType) !;

  if (def.transitiveCompileScopes !== null) {
    return def.transitiveCompileScopes;
  }

  const scopes: NgModuleTransitiveScopes = {
    schemas: def.schemas || null,
    compilation: {
      directives: new Set<any>(),
      pipes: new Set<any>(),
    },
    exported: {
      directives: new Set<any>(),
      pipes: new Set<any>(),
    },
  };

  maybeUnwrapFn(def.imports).forEach(<I>(imported: Type<I>) => {
    const importedType = imported as Type<I>& {
      // If imported is an @NgModule:
      ɵmod?: NgModuleDef<I>;
    };

    if (!isNgModule<I>(importedType)) {
      throw new Error(`Importing ${importedType.name} which does not have a ɵmod property`);
    }

    // When this module imports another, the imported module's exported directives and pipes are
    // added to the compilation scope of this module.
    const importedScope = transitiveScopesFor(importedType);
    importedScope.exported.directives.forEach(entry => scopes.compilation.directives.add(entry));
    importedScope.exported.pipes.forEach(entry => scopes.compilation.pipes.add(entry));
  });

  maybeUnwrapFn(def.declarations).forEach(declared => {
    const declaredWithDefs = declared as Type<any>& { ɵpipe?: any; };

    if (getPipeDef(declaredWithDefs)) {
      scopes.compilation.pipes.add(declared);
    } else {
      // Either declared has a ɵcmp or ɵdir, or it's a component which hasn't
      // had its template compiled yet. In either case, it gets added to the compilation's
      // directives.
      scopes.compilation.directives.add(declared);
    }
  });

  maybeUnwrapFn(def.exports).forEach(<E>(exported: Type<E>) => {
    const exportedType = exported as Type<E>& {
      // Components, Directives, NgModules, and Pipes can all be exported.
      ɵcmp?: any;
      ɵdir?: any;
      ɵmod?: NgModuleDef<E>;
      ɵpipe?: any;
    };

    // Either the type is a module, a pipe, or a component/directive (which may not have a
    // ɵcmp as it might be compiled asynchronously).
    if (isNgModule(exportedType)) {
      // When this module exports another, the exported module's exported directives and pipes are
      // added to both the compilation and exported scopes of this module.
      const exportedScope = transitiveScopesFor(exportedType);
      exportedScope.exported.directives.forEach(entry => {
        scopes.compilation.directives.add(entry);
        scopes.exported.directives.add(entry);
      });
      exportedScope.exported.pipes.forEach(entry => {
        scopes.compilation.pipes.add(entry);
        scopes.exported.pipes.add(entry);
      });
    } else if (getPipeDef(exportedType)) {
      scopes.exported.pipes.add(exportedType);
    } else {
      scopes.exported.directives.add(exportedType);
    }
  });

  def.transitiveCompileScopes = scopes;
  return scopes;
}

function expandModuleWithProviders(value: Type<any>| ModuleWithProviders<{}>): Type<any> {
  if (isModuleWithProviders(value)) {
    return value.ngModule;
  }
  return value;
}

function isModuleWithProviders(value: any): value is ModuleWithProviders<{}> {
  return (value as{ngModule?: any}).ngModule !== undefined;
}

function isNgModule<T>(value: Type<T>): value is Type<T>&{ɵmod: NgModuleDef<T>} {
  return !!getNgModuleDef(value);
}
