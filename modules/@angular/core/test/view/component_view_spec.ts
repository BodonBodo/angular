/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injector, RenderComponentType, RootRenderer, Sanitizer, SecurityContext, ViewEncapsulation} from '@angular/core';
import {ArgumentType, BindingType, NodeCheckFn, NodeDef, NodeFlags, RootData, Services, ViewData, ViewDefinition, ViewFlags, ViewHandleEventFn, ViewState, ViewUpdateFn, anchorDef, asProviderData, directiveDef, elementDef, rootRenderNodes, textDef, viewDef} from '@angular/core/src/view/index';
import {inject} from '@angular/core/testing';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

import {createRootView, isBrowser, removeNodes} from './helper';

export function main() {
  describe(`Component Views`, () => {
    function compViewDef(
        nodes: NodeDef[], update?: ViewUpdateFn, handleEvent?: ViewHandleEventFn,
        viewFlags: ViewFlags = ViewFlags.None): ViewDefinition {
      return viewDef(viewFlags, nodes, update, handleEvent);
    }

    function createAndGetRootNodes(viewDef: ViewDefinition): {rootNodes: any[], view: ViewData} {
      const view = createRootView(viewDef);
      const rootNodes = rootRenderNodes(view);
      return {rootNodes, view};
    }

    it('should create and attach component views', () => {
      let instance: AComp;
      class AComp {
        constructor() { instance = this; }
      }

      const {view, rootNodes} = createAndGetRootNodes(compViewDef([
        elementDef(NodeFlags.None, null, null, 1, 'div'),
        directiveDef(
            NodeFlags.None, null, 0, AComp, [], null, null,
            () => compViewDef([
              elementDef(NodeFlags.None, null, null, 0, 'span'),
            ])),
      ]));

      const compView = asProviderData(view, 1).componentView;

      expect(compView.context).toBe(instance);
      expect(compView.component).toBe(instance);

      const compRootEl = getDOM().childNodes(rootNodes[0])[0];
      expect(getDOM().nodeName(compRootEl).toLowerCase()).toBe('span');
    });

    if (isBrowser()) {
      describe('root views', () => {
        let rootNode: HTMLElement;
        beforeEach(() => {
          rootNode = document.createElement('root');
          document.body.appendChild(rootNode);
          removeNodes.push(rootNode);
        });

        it('should select root elements based on a selector', () => {
          const view = createRootView(
              compViewDef([
                elementDef(NodeFlags.None, null, null, 0, 'div'),
              ]),
              {}, [], 'root');
          const rootNodes = rootRenderNodes(view);
          expect(rootNodes).toEqual([rootNode]);
        });

        it('should select root elements based on a node', () => {
          const view = createRootView(
              compViewDef([
                elementDef(NodeFlags.None, null, null, 0, 'div'),
              ]),
              {}, [], rootNode);
          const rootNodes = rootRenderNodes(view);
          expect(rootNodes).toEqual([rootNode]);
        });

        it('should set attributes on the root node', () => {
          const view = createRootView(
              compViewDef([
                elementDef(NodeFlags.None, null, null, 0, 'div', {'a': 'b'}),
              ]),
              {}, [], rootNode);
          expect(rootNode.getAttribute('a')).toBe('b');
        });

        it('should clear the content of the root node', () => {
          rootNode.appendChild(document.createElement('div'));
          const view = createRootView(
              compViewDef([
                elementDef(NodeFlags.None, null, null, 0, 'div', {'a': 'b'}),
              ]),
              {}, [], rootNode);
          expect(rootNode.childNodes.length).toBe(0);
        });
      });
    }

    describe('data binding', () => {
      it('should dirty check component views', () => {
        let value: any;
        class AComp {
          a: any;
        }

        const update =
            jasmine.createSpy('updater').and.callFake((check: NodeCheckFn, view: ViewData) => {
              check(view, 0, ArgumentType.Inline, value);
            });

        const {view, rootNodes} = createAndGetRootNodes(
          compViewDef([
            elementDef(NodeFlags.None, null, null, 1, 'div'),
            directiveDef(NodeFlags.None, null, 0, AComp, [], null, null, () => compViewDef(
              [
                elementDef(NodeFlags.None, null, null, 0, 'span', null, [[BindingType.ElementAttribute, 'a', SecurityContext.NONE]]),
              ], update
            )),
          ]));
        const compView = asProviderData(view, 1).componentView;

        value = 'v1';
        Services.checkAndUpdateView(view);

        expect(update.calls.mostRecent().args[1]).toBe(compView);

        update.calls.reset();
        Services.checkNoChangesView(view);

        expect(update.calls.mostRecent().args[1]).toBe(compView);

        value = 'v2';
        expect(() => Services.checkNoChangesView(view))
            .toThrowError(
                `ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: 'v1'. Current value: 'v2'.`);
      });

      it('should support detaching and attaching component views for dirty checking', () => {
        class AComp {
          a: any;
        }

        const update = jasmine.createSpy('updater');

        const {view, rootNodes} = createAndGetRootNodes(compViewDef([
          elementDef(NodeFlags.None, null, null, 1, 'div'),
          directiveDef(
              NodeFlags.None, null, 0, AComp, [], null, null,
              () => compViewDef(
                  [
                    elementDef(NodeFlags.None, null, null, 0, 'span'),
                  ],
                  update)),
        ]));

        const compView = asProviderData(view, 1).componentView;

        Services.checkAndUpdateView(view);
        update.calls.reset();

        compView.state &= ~ViewState.ChecksEnabled;
        Services.checkAndUpdateView(view);
        expect(update).not.toHaveBeenCalled();

        compView.state |= ViewState.ChecksEnabled;
        Services.checkAndUpdateView(view);
        expect(update).toHaveBeenCalled();
      });

      if (isBrowser()) {
        it('should support OnPush components', () => {
          let compInputValue: any;
          class AComp {
            a: any;
          }

          const update = jasmine.createSpy('updater');

          const addListenerSpy = spyOn(HTMLElement.prototype, 'addEventListener').and.callThrough();
          const {view, rootNodes} =
              createAndGetRootNodes(
                  compViewDef(
                      [
                        elementDef(NodeFlags.None, null, null, 1, 'div'),
                        directiveDef(
                            NodeFlags.None, null, 0, AComp, [], {a: [0, 'a']}, null,
                            () =>
                                compViewDef(
                                    [
                                      elementDef(NodeFlags.None, null, null, 0, 'span', null, null, ['click']),
                                    ],
                                    update, null, ViewFlags.OnPush)),
                      ],
                      (check, view) => { check(view, 1, ArgumentType.Inline, compInputValue); }));

          const compView = asProviderData(view, 1).componentView;

          Services.checkAndUpdateView(view);

          // auto detach
          update.calls.reset();
          Services.checkAndUpdateView(view);
          expect(update).not.toHaveBeenCalled();

          // auto attach on input changes
          update.calls.reset();
          compInputValue = 'v1';
          Services.checkAndUpdateView(view);
          expect(update).toHaveBeenCalled();

          // auto detach
          update.calls.reset();
          Services.checkAndUpdateView(view);
          expect(update).not.toHaveBeenCalled();

          // auto attach on events
          addListenerSpy.calls.mostRecent().args[1]('SomeEvent');
          update.calls.reset();
          Services.checkAndUpdateView(view);
          expect(update).toHaveBeenCalled();

          // auto detach
          update.calls.reset();
          Services.checkAndUpdateView(view);
          expect(update).not.toHaveBeenCalled();
        });
      }

      it('should stop dirty checking views that threw errors in change detection', () => {
        class AComp {
          a: any;
        }

        const update = jasmine.createSpy('updater');

        const {view, rootNodes} = createAndGetRootNodes(compViewDef([
          elementDef(NodeFlags.None, null, null, 1, 'div'),
          directiveDef(
              NodeFlags.None, null, 0, AComp, [], null, null,
              () => compViewDef(
                  [
                    elementDef(NodeFlags.None, null, null, 0, 'span', null, [[BindingType.ElementAttribute, 'a', SecurityContext.NONE]]),
                  ],
                  update)),
        ]));

        const compView = asProviderData(view, 1).componentView;

        update.and.callFake((check: NodeCheckFn, view: ViewData) => { throw new Error('Test'); });
        expect(() => Services.checkAndUpdateView(view)).toThrowError('Test');
        expect(update).toHaveBeenCalled();

        update.calls.reset();
        Services.checkAndUpdateView(view);
        expect(update).not.toHaveBeenCalled();
      });

    });

    describe('destroy', () => {
      it('should destroy component views', () => {
        const log: string[] = [];

        class AComp {}

        class ChildProvider {
          ngOnDestroy() { log.push('ngOnDestroy'); };
        }

        const {view, rootNodes} = createAndGetRootNodes(compViewDef([
          elementDef(NodeFlags.None, null, null, 1, 'div'),
          directiveDef(
              NodeFlags.None, null, 0, AComp, [], null, null,
              () => compViewDef([
                elementDef(NodeFlags.None, null, null, 1, 'span'),
                directiveDef(NodeFlags.OnDestroy, null, 0, ChildProvider, [])
              ])),
        ]));

        Services.destroyView(view);

        expect(log).toEqual(['ngOnDestroy']);
      });

      it('should throw on dirty checking destroyed views', () => {
        const {view, rootNodes} = createAndGetRootNodes(compViewDef(
            [
              elementDef(NodeFlags.None, null, null, 0, 'div'),
            ],
            (view) => {}));

        Services.destroyView(view);

        expect(() => Services.checkAndUpdateView(view))
            .toThrowError('ViewDestroyedError: Attempt to use a destroyed view: detectChanges');
      });
    });

  });
}