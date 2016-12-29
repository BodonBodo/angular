/**
 * This file is generated by the Angular 2 template compiler.
 * Do not edit.
 */
/* tslint:disable */

import * as import10 from '@angular/common/src/directives/ng_if';
import * as import7 from '@angular/core/src/change_detection/change_detection';
import * as import5 from '@angular/core/src/di/injector';
import * as import9 from '@angular/core/src/linker/component_factory';
import * as import11 from '@angular/core/src/linker/template_ref';
import * as import1 from '@angular/core/src/linker/view';
import * as import2 from '@angular/core/src/linker/view_container';
import * as import6 from '@angular/core/src/linker/view_type';
import * as import4 from '@angular/core/src/linker/view_utils';
import * as import8 from '@angular/core/src/metadata/view';
import * as import0 from '@angular/core/src/render/api';
import * as import12 from '@angular/core/src/security';

import * as import3 from './tree';
import {_View_TreeComponent0} from './tree.ngfactory';

var renderType_TreeComponent_Host: import0.RenderComponentType =
    import4.createRenderComponentType('', 0, import8.ViewEncapsulation.None, [], {});
class _View_TreeComponent_Host0 extends import1.AppView<any> {
  _el_0: any;
  _vc_0: import2.ViewContainer;
  _TreeComponent_0_4: _View_TreeComponent0;
  constructor(
      viewUtils: import4.ViewUtils, parentView: import1.AppView<any>, parentIndex: number,
      parentElement: any) {
    super(
        _View_TreeComponent_Host0, renderType_TreeComponent_Host, import6.ViewType.HOST, viewUtils,
        parentView, parentIndex, parentElement, import7.ChangeDetectorStatus.CheckAlways);
  }
  createInternal(rootSelector: string): import9.ComponentRef<any> {
    this._el_0 = import4.selectOrCreateRenderHostElement(
        this.renderer, 'tree', import4.EMPTY_INLINE_ARRAY, rootSelector, (null as any));
    this._vc_0 = new import2.ViewContainer(0, (null as any), this, this._el_0);
    this._TreeComponent_0_4 = new _View_TreeComponent0(this._el_0);
    this.init([].concat([this._el_0]), [this._el_0], []);
    return new import9.ComponentRef_(0, this, this._el_0, this._TreeComponent_0_4.context);
  }
  detectChangesInternal(): void {
    this._TreeComponent_0_4.detectChangesInternal(this.throwOnChange);
  }
  destroyInternal(): void { this._TreeComponent_0_4.destroyInternal(); }
  injectorGetInternal(token: any, requestNodeIndex: number, notFoundResult: any): any {
    if (((token === import3.TreeComponent) && (0 === requestNodeIndex))) {
      return this._TreeComponent_0_4;
    }
    return notFoundResult;
  }
}
export const TreeComponentNgFactory: import9.ComponentFactory<import3.TreeComponent> =
    new import9.ComponentFactory<import3.TreeComponent>(
        'tree', _View_TreeComponent_Host0, import3.TreeComponent);
