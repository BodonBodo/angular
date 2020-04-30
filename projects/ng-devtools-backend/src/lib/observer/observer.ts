import { ElementPosition, LifecycleProfile } from 'protocol';
import { componentMetadata } from '../utils';
import { IdentityTracker, IndexedNode } from './identity-tracker';
import { getLViewFromDirectiveOrElementInstance, getDirectiveHostElement } from '../lview-transform';
import { DEV_TOOLS_HIGHLIGHT_NODE_ID, getDirectiveName } from '../highlighter';

export type CreationCallback = (
  componentOrDirective: any,
  node: Node,
  id: number,
  isComponent: boolean,
  position: ElementPosition
) => void;

export type LifecycleStartCallback = (
  componentOrDirective: any,
  node: Node,
  id: number,
  isComponent: boolean,
  hook: keyof LifecycleProfile | 'unknown'
) => void;

export type LifecycleEndCallback = (
  componentOrDirective: any,
  node: Node,
  id: number,
  isComponent: boolean,
  hook: keyof LifecycleProfile | 'unknown'
) => void;

export type ChangeDetectionStartCallback = (component: any, node: Node, id: number, position: ElementPosition) => void;

export type ChangeDetectionEndCallback = (component: any, node: Node, id: number, position: ElementPosition) => void;

export type DestroyCallback = (
  componentOrDirective: any,
  node: Node,
  id: number,
  isComponent: boolean,
  position: ElementPosition
) => void;

export interface Config {
  onCreate: CreationCallback;
  onDestroy: DestroyCallback;
  onChangeDetectionStart: ChangeDetectionStartCallback;
  onChangeDetectionEnd: ChangeDetectionEndCallback;
  onLifecycleHookStart: LifecycleStartCallback;
  onLifecycleHookEnd: LifecycleEndCallback;
}

const hookNames = [
  'OnInit',
  'OnDestroy',
  'OnChanges',
  'DoCheck',
  'AfterContentInit',
  'AfterContentChecked',
  'AfterViewInit',
  'AfterViewChecked',
];

const hookMethodNames = new Set(hookNames.map((hook) => `ng${hook}`));

const hookTViewProperties = [
  'preOrderHooks',
  'preOrderCheckHooks',
  'contentHooks',
  'contentCheckHooks',
  'viewHooks',
  'viewCheckHooks',
  'destroyHooks',
];

const getLifeCycleName = (obj: {}, fn: any): keyof LifecycleProfile | 'unknown' => {
  const proto = Object.getPrototypeOf(obj);
  const keys = Object.getOwnPropertyNames(proto);
  for (const propName of keys) {
    // We don't want to touch random get accessors.
    if (!hookMethodNames.has(propName)) {
      continue;
    }
    if (proto[propName] === fn) {
      return propName as keyof LifecycleProfile;
    }
  }
  return 'unknown';
};

/**
 * This is a temporal "polyfill" until we receive more comprehensive framework
 * debugging APIs. This observer checks for new elements added. When it detects
 * this has happened, it checks if any of the elements in the tree with root
 * the added element is a component. If it is, it throws a creation event.
 * The polyfill also patches the tView template function reference to allow
 * tracking of how much time we spend in the particular component in change detection.
 */
export class DirectiveForestObserver {
  private _mutationObserver = new MutationObserver(this._onMutation.bind(this));
  private _patched = new Map<any, () => void>();
  private _undoLifecyclePatch: (() => void)[] = [];
  private _lastChangeDetection = new Map<any, number>();
  private _tracker = new IdentityTracker();
  private _forest: IndexedNode[] = [];

  constructor(private _config: Partial<Config>) {}

  getDirectivePosition(dir: any): ElementPosition | undefined {
    const result = this._tracker.getDirectivePosition(dir);
    if (result === undefined) {
      console.warn('Unable to find position of', dir);
    }
    return result;
  }

  getDirectiveId(dir: any): number | undefined {
    const result = this._tracker.getDirectiveId(dir);
    if (result === undefined) {
      console.warn('Unable to find ID of', result);
    }
    return result;
  }

  getDirectiveForest(): IndexedNode[] {
    return this._forest;
  }

  initialize(): void {
    this._mutationObserver.observe(document, {
      subtree: true,
      childList: true,
    });
    this.indexForest();
  }

  destroy(): void {
    this._mutationObserver.disconnect();
    this._lastChangeDetection = new Map<any, number>();
    this._tracker.destroy();

    for (const [cmp, template] of this._patched) {
      const meta = componentMetadata(cmp);
      meta.template = template;
      meta.tView.template = template;
    }

    this._patched = new Map<any, () => void>();
    this._undoLifecyclePatch.forEach((p) => p());
    this._undoLifecyclePatch = [];
  }

  indexForest(): void {
    const { newNodes, removedNodes, indexedForest } = this._tracker.index();
    this._forest = indexedForest;
    newNodes.forEach((node) => {
      if (this._config.onLifecycleHookStart || this._config.onLifecycleHookEnd) {
        this._observeLifecycle(node.directive, node.isComponent);
      }
      if (node.isComponent && (this._config.onChangeDetectionStart || this._config.onChangeDetectionEnd)) {
        this._observeComponent(node.directive);
      }
      this._fireCreationCallback(node.directive, node.isComponent);
    });
    removedNodes.forEach((node) => {
      this._patched.delete(node.directive);
      this._fireDestroyCallback(node.directive, node.isComponent);
    });
  }

  private _onMutation(records: MutationRecord[]): void {
    if (this._isDevToolsMutation(records)) {
      return;
    }
    this.indexForest();
  }

  private _fireCreationCallback(component: any, isComponent: boolean): void {
    if (!this._config.onCreate) {
      return;
    }
    const position = this._tracker.getDirectivePosition(component);
    if (position === undefined) {
      return;
    }
    const id = this._tracker.getDirectiveId(component);
    if (id === undefined) {
      return;
    }
    this._config.onCreate(component, getDirectiveHostElement(component), id, isComponent, position);
  }

  private _fireDestroyCallback(component: any, isComponent: boolean): void {
    if (!this._config.onDestroy) {
      return;
    }
    const position = this._tracker.getDirectivePosition(component);
    if (position === undefined) {
      return;
    }
    const id = this._tracker.getDirectiveId(component);
    if (id === undefined) {
      return;
    }
    this._config.onDestroy(component, getDirectiveHostElement(component), id, isComponent, position);
  }

  private _observeComponent(cmp: any): void {
    const declarations = componentMetadata(cmp);
    const original = declarations.template;
    const self = this;
    if (original.patched) {
      return;
    }
    declarations.tView.template = function (_: any, component: any): void {
      const position = self._tracker.getDirectivePosition(component);
      const start = performance.now();
      const id = self._tracker.getDirectiveId(component);

      if (self._config.onChangeDetectionStart && id !== undefined && position !== undefined) {
        self._config.onChangeDetectionStart(component, getDirectiveHostElement(component), id, position);
      }
      original.apply(this, arguments);
      if (self._tracker.hasDirective(component) && id !== undefined && position !== undefined) {
        if (self._config.onChangeDetectionEnd) {
          self._config.onChangeDetectionEnd(component, getDirectiveHostElement(component), id, position);
        }
      } else {
        self._lastChangeDetection.set(component, performance.now() - start);
      }
    };
    declarations.tView.template.patched = true;
    this._patched.set(cmp, original);
  }

  private _observeLifecycle(directive: any, isComponent: boolean): void {
    const ctx = getLViewFromDirectiveOrElementInstance(directive);
    if (!ctx) {
      return;
    }
    const tview = ctx[1];
    hookTViewProperties.forEach((hook) => {
      const current = tview[hook];
      if (!Array.isArray(current)) {
        return;
      }
      current.forEach((el: any, idx: number) => {
        if (el.patched) {
          return;
        }
        if (typeof el === 'function') {
          const self = this;
          current[idx] = function (): any {
            const id = self._tracker.getDirectiveId(this);
            const lifecycleHookName = getLifeCycleName(this, el);
            const element = getDirectiveHostElement(this);
            if (self._config.onLifecycleHookStart && id !== undefined) {
              self._config.onLifecycleHookStart(this, element, id, isComponent, lifecycleHookName);
            }
            const result = el.apply(this, arguments);
            if (self._config.onLifecycleHookEnd && id !== undefined) {
              self._config.onLifecycleHookEnd(this, element, id, isComponent, lifecycleHookName);
            }
            return result;
          };
          current[idx].patched = true;
          this._undoLifecyclePatch.push(() => {
            current[idx] = el;
          });
        }
      });
    });
  }

  private _isDevToolsMutation(records: MutationRecord[]): boolean {
    for (const record of records) {
      if (containsInternalElements(record.addedNodes)) {
        return true;
      }
      if (containsInternalElements(record.removedNodes)) {
        return true;
      }
    }
    return false;
  }
}

const containsInternalElements = (nodes: NodeList): boolean => {
  // tslint:disable prefer-for-of
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (!(node instanceof Element)) {
      continue;
    }
    const attr = node.getAttribute('id');
    if (attr === DEV_TOOLS_HIGHLIGHT_NODE_ID) {
      return true;
    }
  }
  return false;
};
