/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {StyleSanitizeFn} from '../sanitization/style_sanitizer';
import {assertDefined} from '../util/assert';
import {assertLViewOrUndefined} from './assert';
import {TNode} from './interfaces/node';
import {CONTEXT, DECLARATION_VIEW, LView, OpaqueViewState, TVIEW} from './interfaces/view';


/**
 *
 */
interface LFrame {
  /**
   * Parent LFrame.
   *
   * This is needed when `leaveView` is called to restore the previous state.
   */
  parent: LFrame;

  /**
   * Child LFrame.
   *
   * This is used to cache existing LFrames to relieve the memory pressure.
   */
  child: LFrame|null;

  /**
   * State of the current view being processed.
   *
   * An array of nodes (text, element, container, etc), pipes, their bindings, and
   * any local variables that need to be stored between invocations.
   */
  lView: LView;

  /**
   * Used to set the parent property when nodes are created and track query results.
   *
   * This is used in conjunction with `isParent`.
   */
  previousOrParentTNode: TNode;

  /**
   * If `isParent` is:
   *  - `true`: then `previousOrParentTNode` points to a parent node.
   *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
   */
  isParent: boolean;

  /**
   * Index of currently selected element in LView.
   *
   * Used by binding instructions. Updated as part of advance instruction.
   */
  selectedIndex: number;

  /**
   * Current pointer to the binding index.
   */
  bindingIndex: number;

  /**
   * The last viewData retrieved by nextContext().
   * Allows building nextContext() and reference() calls.
   *
   * e.g. const inner = x().$implicit; const outer = x().$implicit;
   */
  contextLView: LView;

  /**
   * Store the element depth count. This is used to identify the root elements of the template
   * so that we can then attach patch data `LView` to only those elements. We know that those
   * are the only places where the patch data could change, this way we will save on number
   * of places where tha patching occurs.
   */
  elementDepthCount: number;

  /**
   * Current namespace to be used when creating elements
   */
  currentNamespace: string|null;

  /**
   * Current sanitizer
   */
  currentSanitizer: StyleSanitizeFn|null;


  /**
   * The root index from which pure function instructions should calculate their binding
   * indices. In component views, this is TView.bindingStartIndex. In a host binding
   * context, this is the TView.expandoStartIndex + any dirs/hostVars before the given dir.
   */
  bindingRootIndex: number;

  /**
   * Current index of a View or Content Query which needs to be processed next.
   * We iterate over the list of Queries and increment current query index at every step.
   */
  currentQueryIndex: number;

  /**
   * When host binding is executing this points to the directive index.
   * `TView.data[currentDirectiveIndex]` is `DirectiveDef`
   * `LView[currentDirectiveIndex]` is directive instance.
   */
  currentDirectiveIndex: number;
}

/**
 * All implicit instruction state is stored here.
 *
 * It is useful to have a single object where all of the state is stored as a mental model
 * (rather it being spread across many different variables.)
 *
 * PERF NOTE: Turns out that writing to a true global variable is slower than
 * having an intermediate object with properties.
 */
interface InstructionState {
  /**
   * Current `LFrame`
   *
   * `null` if we have not called `enterView`
   */
  lFrame: LFrame;

  /**
   * Stores whether directives should be matched to elements.
   *
   * When template contains `ngNonBindable` then we need to prevent the runtime from matching
   * directives on children of that element.
   *
   * Example:
   * ```
   * <my-comp my-directive>
   *   Should match component / directive.
   * </my-comp>
   * <div ngNonBindable>
   *   <my-comp my-directive>
   *     Should not match component / directive because we are in ngNonBindable.
   *   </my-comp>
   * </div>
   * ```
   */
  bindingsEnabled: boolean;

  /**
   * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
   *
   * Necessary to support ChangeDetectorRef.checkNoChanges().
   */
  checkNoChangesMode: boolean;
}

export const instructionState: InstructionState = {
  lFrame: createLFrame(null),
  bindingsEnabled: true,
  checkNoChangesMode: false,
};


export function getElementDepthCount() {
  return instructionState.lFrame.elementDepthCount;
}

export function increaseElementDepthCount() {
  instructionState.lFrame.elementDepthCount++;
}

export function decreaseElementDepthCount() {
  instructionState.lFrame.elementDepthCount--;
}

export function getBindingsEnabled(): boolean {
  return instructionState.bindingsEnabled;
}


/**
 * Enables directive matching on elements.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- ɵɵdisableBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- ɵɵenableBindings() -->
 * </div>
 * ```
 *
 * @codeGenApi
 */
export function ɵɵenableBindings(): void {
  instructionState.bindingsEnabled = true;
}

/**
 * Disables directive matching on element.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- ɵɵdisableBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- ɵɵenableBindings() -->
 * </div>
 * ```
 *
 * @codeGenApi
 */
export function ɵɵdisableBindings(): void {
  instructionState.bindingsEnabled = false;
}

/**
 * Return the current LView.
 *
 * The return value can be `null` if the method is called outside of template. This can happen if
 * directive is instantiated by module injector (rather than by node injector.)
 */
export function getLView(): LView {
  // TODO(misko): the return value should be `LView|null` but doing so breaks a lot of code.
  const lFrame = instructionState.lFrame;
  return lFrame === null ? null ! : lFrame.lView;
}

/**
 * Sets the active directive host element and resets the directive id value
 * (when the provided elementIndex value has changed).
 *
 * @param elementIndex the element index value for the host element where
 *                     the directive/component instance lives
 */
export function setActiveHostElement(elementIndex: number) {
  setSelectedIndex(elementIndex);
}

export function clearActiveHostElement() {
  setSelectedIndex(-1);
}

/**
 * Restores `contextViewData` to the given OpaqueViewState instance.
 *
 * Used in conjunction with the getCurrentView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 *
 * @param viewToRestore The OpaqueViewState instance to restore.
 *
 * @codeGenApi
 */
export function ɵɵrestoreView(viewToRestore: OpaqueViewState) {
  instructionState.lFrame.contextLView = viewToRestore as any as LView;
}

export function getPreviousOrParentTNode(): TNode {
  return instructionState.lFrame.previousOrParentTNode;
}

export function setPreviousOrParentTNode(tNode: TNode, _isParent: boolean) {
  instructionState.lFrame.previousOrParentTNode = tNode;
  instructionState.lFrame.isParent = _isParent;
}

export function getIsParent(): boolean {
  return instructionState.lFrame.isParent;
}

export function setIsNotParent(): void {
  instructionState.lFrame.isParent = false;
}
export function setIsParent(): void {
  instructionState.lFrame.isParent = true;
}

export function getContextLView(): LView {
  return instructionState.lFrame.contextLView;
}

export function getCheckNoChangesMode(): boolean {
  // TODO(misko): remove this from the LView since it is ngDevMode=true mode only.
  return instructionState.checkNoChangesMode;
}

export function setCheckNoChangesMode(mode: boolean): void {
  instructionState.checkNoChangesMode = mode;
}

// top level variables should not be exported for performance reasons (PERF_NOTES.md)
export function getBindingRoot() {
  const lFrame = instructionState.lFrame;
  let index = lFrame.bindingRootIndex;
  if (index === -1) {
    const lView = lFrame.lView;
    index = lFrame.bindingRootIndex = lView[TVIEW].bindingStartIndex;
  }
  return index;
}

export function getBindingIndex(): number {
  return instructionState.lFrame.bindingIndex;
}

export function setBindingIndex(value: number): number {
  return instructionState.lFrame.bindingIndex = value;
}

export function nextBindingIndex(): number {
  return instructionState.lFrame.bindingIndex++;
}

export function incrementBindingIndex(count: number): number {
  const lFrame = instructionState.lFrame;
  const index = lFrame.bindingIndex;
  lFrame.bindingIndex = lFrame.bindingIndex + count;
  return index;
}

/**
 * Set a new binding root index so that host template functions can execute.
 *
 * Bindings inside the host template are 0 index. But because we don't know ahead of time
 * how many host bindings we have we can't pre-compute them. For this reason they are all
 * 0 index and we just shift the root so that they match next available location in the LView.
 *
 * @param bindingRootIndex Root index for `hostBindings`
 * @param currentDirectiveIndex `TData[currentDirectiveIndex]` will point to the current directive
 *        whose `hostBindings` are being processed.
 */
export function setBindingRootForHostBindings(
    bindingRootIndex: number, currentDirectiveIndex: number) {
  const lFrame = instructionState.lFrame;
  lFrame.bindingIndex = lFrame.bindingRootIndex = bindingRootIndex;
  lFrame.currentDirectiveIndex = currentDirectiveIndex;
}

/**
 * When host binding is executing this points to the directive index.
 * `TView.data[getCurrentDirectiveIndex()]` is `DirectiveDef`
 * `LView[getCurrentDirectiveIndex()]` is directive instance.
 */
export function getCurrentDirectiveIndex(): number {
  return instructionState.lFrame.currentDirectiveIndex;
}

export function getCurrentQueryIndex(): number {
  return instructionState.lFrame.currentQueryIndex;
}

export function setCurrentQueryIndex(value: number): void {
  instructionState.lFrame.currentQueryIndex = value;
}

/**
 * This is a light weight version of the `enterView` which is needed by the DI system.
 * @param newView
 * @param tNode
 */
export function enterDI(newView: LView, tNode: TNode) {
  ngDevMode && assertLViewOrUndefined(newView);
  const newLFrame = allocLFrame();
  instructionState.lFrame = newLFrame;
  newLFrame.previousOrParentTNode = tNode !;
  newLFrame.lView = newView;
  if (ngDevMode) {
    // resetting for safety in dev mode only.
    newLFrame.isParent = DEV_MODE_VALUE;
    newLFrame.selectedIndex = DEV_MODE_VALUE;
    newLFrame.contextLView = DEV_MODE_VALUE;
    newLFrame.elementDepthCount = DEV_MODE_VALUE;
    newLFrame.currentNamespace = DEV_MODE_VALUE;
    newLFrame.currentSanitizer = DEV_MODE_VALUE;
    newLFrame.bindingRootIndex = DEV_MODE_VALUE;
    newLFrame.currentQueryIndex = DEV_MODE_VALUE;
  }
}

const DEV_MODE_VALUE: any =
    'Value indicating that DI is trying to read value which it should not need to know about.';

/**
 * This is a light weight version of the `leaveView` which is needed by the DI system.
 *
 * Because the implementation is same it is only an alias
 */
export const leaveDI = leaveView;

/**
 * Swap the current lView with a new lView.
 *
 * For performance reasons we store the lView in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the lView for later, and when the view is
 * exited the state has to be restored
 *
 * @param newView New lView to become active
 * @param tNode Element to which the View is a child of
 * @returns the previously active lView;
 */
export function enterView(newView: LView, tNode: TNode | null): void {
  ngDevMode && assertLViewOrUndefined(newView);
  const newLFrame = allocLFrame();
  instructionState.lFrame = newLFrame;
  newLFrame.previousOrParentTNode = tNode !;
  newLFrame.isParent = true;
  newLFrame.lView = newView;
  newLFrame.selectedIndex = 0;
  newLFrame.contextLView = newView !;
  newLFrame.elementDepthCount = 0;
  newLFrame.currentDirectiveIndex = -1;
  newLFrame.currentNamespace = null;
  newLFrame.currentSanitizer = null;
  newLFrame.bindingRootIndex = -1;
  newLFrame.bindingIndex = newView === null ? -1 : newView[TVIEW].bindingStartIndex;
  newLFrame.currentQueryIndex = 0;
}

/**
 * Allocates next free LFrame. This function tries to reuse the `LFrame`s to lower memory pressure.
 */
function allocLFrame() {
  const currentLFrame = instructionState.lFrame;
  const childLFrame = currentLFrame === null ? null : currentLFrame.child;
  const newLFrame = childLFrame === null ? createLFrame(currentLFrame) : childLFrame;
  return newLFrame;
}

function createLFrame(parent: LFrame | null): LFrame {
  const lFrame: LFrame = {
    previousOrParentTNode: null !,  //
    isParent: true,                 //
    lView: null !,                  //
    selectedIndex: 0,               //
    contextLView: null !,           //
    elementDepthCount: 0,           //
    currentNamespace: null,         //
    currentSanitizer: null,         //
    currentDirectiveIndex: -1,      //
    bindingRootIndex: -1,           //
    bindingIndex: -1,               //
    currentQueryIndex: 0,           //
    parent: parent !,               //
    child: null,                    //
  };
  parent !== null && (parent.child = lFrame);  // link the new LFrame for reuse.
  return lFrame;
}

export function leaveView() {
  instructionState.lFrame = instructionState.lFrame.parent;
}

export function nextContextImpl<T = any>(level: number): T {
  const contextLView = instructionState.lFrame.contextLView =
      walkUpViews(level, instructionState.lFrame.contextLView !);
  return contextLView[CONTEXT] as T;
}

function walkUpViews(nestingLevel: number, currentView: LView): LView {
  while (nestingLevel > 0) {
    ngDevMode && assertDefined(
                     currentView[DECLARATION_VIEW],
                     'Declaration view should be defined if nesting level is greater than 0.');
    currentView = currentView[DECLARATION_VIEW] !;
    nestingLevel--;
  }
  return currentView;
}

/**
 * Gets the currently selected element index.
 *
 * Used with {@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 */
export function getSelectedIndex() {
  return instructionState.lFrame.selectedIndex;
}

/**
 * Sets the most recent index passed to {@link select}
 *
 * Used with {@link property} instruction (and more in the future) to identify the index in the
 * current `LView` to act on.
 *
 * (Note that if an "exit function" was set earlier (via `setElementExitFn()`) then that will be
 * run if and when the provided `index` value is different from the current selected index value.)
 */
export function setSelectedIndex(index: number) {
  instructionState.lFrame.selectedIndex = index;
}


/**
 * Sets the namespace used to create elements to `'http://www.w3.org/2000/svg'` in global state.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceSVG() {
  instructionState.lFrame.currentNamespace = 'http://www.w3.org/2000/svg';
}

/**
 * Sets the namespace used to create elements to `'http://www.w3.org/1998/MathML/'` in global state.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceMathML() {
  instructionState.lFrame.currentNamespace = 'http://www.w3.org/1998/MathML/';
}

/**
 * Sets the namespace used to create elements to `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 *
 * @codeGenApi
 */
export function ɵɵnamespaceHTML() {
  namespaceHTMLInternal();
}

/**
 * Sets the namespace used to create elements to `null`, which forces element creation to use
 * `createElement` rather than `createElementNS`.
 */
export function namespaceHTMLInternal() {
  instructionState.lFrame.currentNamespace = null;
}

export function getNamespace(): string|null {
  return instructionState.lFrame.currentNamespace;
}

export function setCurrentStyleSanitizer(sanitizer: StyleSanitizeFn | null) {
  instructionState.lFrame.currentSanitizer = sanitizer;
}

export function resetCurrentStyleSanitizer() {
  setCurrentStyleSanitizer(null);
}

export function getCurrentStyleSanitizer() {
  // TODO(misko): This should throw when there is no LView, but it turns out we can get here from
  // `NodeStyleDebug` hence we return `null`. This should be fixed
  const lFrame = instructionState.lFrame;
  return lFrame === null ? null : lFrame.currentSanitizer;
}

/**
 * Used for encoding both Class and Style index into `LFrame.stylingBindingChanged`.
 */
const enum BindingChanged {
  CLASS_SHIFT = 16,
  STYLE_MASK = 0xFFFF,
}
