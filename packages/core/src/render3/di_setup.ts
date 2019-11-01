/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


import {resolveForwardRef} from '../di/forward_ref';
import {ClassProvider, Provider} from '../di/interface/provider';
import {isClassProvider, isTypeProvider, providerToFactory} from '../di/r3_injector';

import {diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode} from './di';
import {ɵɵdirectiveInject} from './instructions/all';
import {DirectiveDef} from './interfaces/definition';
import {NodeInjectorFactory} from './interfaces/injector';
import {TContainerNode, TDirectiveHostNode, TElementContainerNode, TElementNode, TNodeProviderIndexes} from './interfaces/node';
import {isComponentDef} from './interfaces/type_checks';
import {LView, TData, TVIEW, TView} from './interfaces/view';
import {getLView, getPreviousOrParentTNode} from './state';



/**
 * Resolves the providers which are defined in the DirectiveDef.
 *
 * When inserting the tokens and the factories in their respective arrays, we can assume that
 * this method is called first for the component (if any), and then for other directives on the same
 * node.
 * As a consequence,the providers are always processed in that order:
 * 1) The view providers of the component
 * 2) The providers of the component
 * 3) The providers of the other directives
 * This matches the structure of the injectables arrays of a view (for each node).
 * So the tokens and the factories can be pushed at the end of the arrays, except
 * in one case for multi providers.
 *
 * @param def the directive definition
 * @param providers: Array of `providers`.
 * @param viewProviders: Array of `viewProviders`.
 */
export function providersResolver<T>(
    def: DirectiveDef<T>, providers: Provider[], viewProviders: Provider[]): void {
  const lView = getLView();
  const tView: TView = lView[TVIEW];
  if (tView.firstCreatePass) {
    const isComponent = isComponentDef(def);

    // The list of view providers is processed first, and the flags are updated
    resolveProvider(viewProviders, tView.data, tView.blueprint, isComponent, true);

    // Then, the list of providers is processed, and the flags are updated
    resolveProvider(providers, tView.data, tView.blueprint, isComponent, false);
  }
}

/**
 * Resolves a provider and publishes it to the DI system.
 */
function resolveProvider(
    provider: Provider, tInjectables: TData, lInjectablesBlueprint: NodeInjectorFactory[],
    isComponent: boolean, isViewProvider: boolean): void {
  provider = resolveForwardRef(provider);
  if (Array.isArray(provider)) {
    // Recursively call `resolveProvider`
    // Recursion is OK in this case because this code will not be in hot-path once we implement
    // cloning of the initial state.
    for (let i = 0; i < provider.length; i++) {
      resolveProvider(
          provider[i], tInjectables, lInjectablesBlueprint, isComponent, isViewProvider);
    }
  } else {
    const lView = getLView();
    const tView = lView[TVIEW];
    let token: any = isTypeProvider(provider) ? provider : resolveForwardRef(provider.provide);
    let providerFactory: () => any = providerToFactory(provider);

    const tNode = getPreviousOrParentTNode();
    const beginIndex = tNode.providerIndexes & TNodeProviderIndexes.ProvidersStartIndexMask;
    const endIndex = tNode.directiveStart;
    const cptViewProvidersCount =
        tNode.providerIndexes >> TNodeProviderIndexes.CptViewProvidersCountShift;

    if (isClassProvider(provider) || isTypeProvider(provider)) {
      const prototype = ((provider as ClassProvider).useClass || provider).prototype;
      const ngOnDestroy = prototype.ngOnDestroy;

      if (ngOnDestroy) {
        (tView.destroyHooks || (tView.destroyHooks = [])).push(tInjectables.length, ngOnDestroy);
      }
    }

    if (isTypeProvider(provider) || !provider.multi) {
      // Single provider case: the factory is created and pushed immediately
      const factory = new NodeInjectorFactory(providerFactory, isViewProvider, ɵɵdirectiveInject);
      const existingFactoryIndex = indexOf(
          token, tInjectables, isViewProvider ? beginIndex : beginIndex + cptViewProvidersCount,
          endIndex);
      if (existingFactoryIndex == -1) {
        diPublicInInjector(
            getOrCreateNodeInjectorForNode(
                tNode as TElementNode | TContainerNode | TElementContainerNode, lView),
            tView, token);
        tInjectables.push(token);
        tNode.directiveStart++;
        tNode.directiveEnd++;
        if (isViewProvider) {
          tNode.providerIndexes += TNodeProviderIndexes.CptViewProvidersCountShifter;
        }
        lInjectablesBlueprint.push(factory);
        lView.push(factory);
      } else {
        lInjectablesBlueprint[existingFactoryIndex] = factory;
        lView[existingFactoryIndex] = factory;
      }
    } else {
      // Multi provider case:
      // We create a multi factory which is going to aggregate all the values.
      // Since the output of such a factory depends on content or view injection,
      // we create two of them, which are linked together.
      //
      // The first one (for view providers) is always in the first block of the injectables array,
      // and the second one (for providers) is always in the second block.
      // This is important because view providers have higher priority. When a multi token
      // is being looked up, the view providers should be found first.
      // Note that it is not possible to have a multi factory in the third block (directive block).
      //
      // The algorithm to process multi providers is as follows:
      // 1) If the multi provider comes from the `viewProviders` of the component:
      //   a) If the special view providers factory doesn't exist, it is created and pushed.
      //   b) Else, the multi provider is added to the existing multi factory.
      // 2) If the multi provider comes from the `providers` of the component or of another
      // directive:
      //   a) If the multi factory doesn't exist, it is created and provider pushed into it.
      //      It is also linked to the multi factory for view providers, if it exists.
      //   b) Else, the multi provider is added to the existing multi factory.

      const existingProvidersFactoryIndex =
          indexOf(token, tInjectables, beginIndex + cptViewProvidersCount, endIndex);
      const existingViewProvidersFactoryIndex =
          indexOf(token, tInjectables, beginIndex, beginIndex + cptViewProvidersCount);
      const doesProvidersFactoryExist = existingProvidersFactoryIndex >= 0 &&
          lInjectablesBlueprint[existingProvidersFactoryIndex];
      const doesViewProvidersFactoryExist = existingViewProvidersFactoryIndex >= 0 &&
          lInjectablesBlueprint[existingViewProvidersFactoryIndex];

      if (isViewProvider && !doesViewProvidersFactoryExist ||
          !isViewProvider && !doesProvidersFactoryExist) {
        // Cases 1.a and 2.a
        diPublicInInjector(
            getOrCreateNodeInjectorForNode(
                tNode as TElementNode | TContainerNode | TElementContainerNode, lView),
            tView, token);
        const factory = multiFactory(
            isViewProvider ? multiViewProvidersFactoryResolver : multiProvidersFactoryResolver,
            lInjectablesBlueprint.length, isViewProvider, isComponent, providerFactory);
        if (!isViewProvider && doesViewProvidersFactoryExist) {
          lInjectablesBlueprint[existingViewProvidersFactoryIndex].providerFactory = factory;
        }
        tInjectables.push(token);
        tNode.directiveStart++;
        tNode.directiveEnd++;
        if (isViewProvider) {
          tNode.providerIndexes += TNodeProviderIndexes.CptViewProvidersCountShifter;
        }
        lInjectablesBlueprint.push(factory);
        lView.push(factory);
      } else {
        // Cases 1.b and 2.b
        multiFactoryAdd(
            lInjectablesBlueprint ![isViewProvider ? existingViewProvidersFactoryIndex : existingProvidersFactoryIndex],
            providerFactory, !isViewProvider && isComponent);
      }
      if (!isViewProvider && isComponent && doesViewProvidersFactoryExist) {
        lInjectablesBlueprint[existingViewProvidersFactoryIndex].componentProviders !++;
      }
    }
  }
}

/**
 * Add a factory in a multi factory.
 */
function multiFactoryAdd(
    multiFactory: NodeInjectorFactory, factory: () => any, isComponentProvider: boolean): void {
  multiFactory.multi !.push(factory);
  if (isComponentProvider) {
    multiFactory.componentProviders !++;
  }
}

/**
 * Returns the index of item in the array, but only in the begin to end range.
 */
function indexOf(item: any, arr: any[], begin: number, end: number) {
  for (let i = begin; i < end; i++) {
    if (arr[i] === item) return i;
  }
  return -1;
}

/**
 * Use this with `multi` `providers`.
 */
function multiProvidersFactoryResolver(
    this: NodeInjectorFactory, _: undefined, tData: TData, lData: LView,
    tNode: TDirectiveHostNode): any[] {
  return multiResolve(this.multi !, []);
}

/**
 * Use this with `multi` `viewProviders`.
 *
 * This factory knows how to concatenate itself with the existing `multi` `providers`.
 */
function multiViewProvidersFactoryResolver(
    this: NodeInjectorFactory, _: undefined, tData: TData, lData: LView,
    tNode: TDirectiveHostNode): any[] {
  const factories = this.multi !;
  let result: any[];
  if (this.providerFactory) {
    const componentCount = this.providerFactory.componentProviders !;
    const multiProviders = getNodeInjectable(tData, lData, this.providerFactory !.index !, tNode);
    // Copy the section of the array which contains `multi` `providers` from the component
    result = multiProviders.slice(0, componentCount);
    // Insert the `viewProvider` instances.
    multiResolve(factories, result);
    // Copy the section of the array which contains `multi` `providers` from other directives
    for (let i = componentCount; i < multiProviders.length; i++) {
      result.push(multiProviders[i]);
    }
  } else {
    result = [];
    // Insert the `viewProvider` instances.
    multiResolve(factories, result);
  }
  return result;
}

/**
 * Maps an array of factories into an array of values.
 */
function multiResolve(factories: Array<() => any>, result: any[]): any[] {
  for (let i = 0; i < factories.length; i++) {
    const factory = factories[i] !as() => null;
    result.push(factory());
  }
  return result;
}

/**
 * Creates a multi factory.
 */
function multiFactory(
    factoryFn: (
        this: NodeInjectorFactory, _: undefined, tData: TData, lData: LView,
        tNode: TDirectiveHostNode) => any,
    index: number, isViewProvider: boolean, isComponent: boolean,
    f: () => any): NodeInjectorFactory {
  const factory = new NodeInjectorFactory(factoryFn, isViewProvider, ɵɵdirectiveInject);
  factory.multi = [];
  factory.index = index;
  factory.componentProviders = 0;
  multiFactoryAdd(factory, f, isComponent && !isViewProvider);
  return factory;
}
