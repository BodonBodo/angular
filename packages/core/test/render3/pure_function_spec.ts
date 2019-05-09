/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ΔdefineComponent} from '../../src/render3/index';
import {Δbind, Δcontainer, ΔcontainerRefreshEnd, ΔcontainerRefreshStart, ΔelementEnd, ΔelementProperty, ΔelementStart, ΔembeddedViewEnd, ΔembeddedViewStart} from '../../src/render3/instructions/all';
import {RenderFlags} from '../../src/render3/interfaces/definition';
import {ΔpureFunction2} from '../../src/render3/pure_function';
import {getDirectiveOnNode, renderToHtml} from '../../test/render3/render_util';


describe('object literals', () => {
  let objectComp: ObjectComp;

  class ObjectComp {
    // TODO(issue/24571): remove '!'.
    config !: {[key: string]: any};

    static ngComponentDef = ΔdefineComponent({
      type: ObjectComp,
      selectors: [['object-comp']],
      factory: function ObjectComp_Factory() { return objectComp = new ObjectComp(); },
      consts: 0,
      vars: 1,
      template: function ObjectComp_Template() {},
      inputs: {config: 'config'}
    });
  }

  const defs = [ObjectComp];

  // NOTE: This test cannot be ported to acceptance tests with TestBed because
  // the syntax is still unsupported.
  it('should support multiple view instances with multiple bindings', () => {
    let objectComps: ObjectComp[] = [];

    /**
     * % for(let i = 0; i < 2; i++) {
     *   <object-comp [config]="{opacity: configs[i].opacity, duration: configs[i].duration}">
     *   </object-comp>
     * % }
     */
    function Template(rf: RenderFlags, ctx: any) {
      if (rf & RenderFlags.Create) {
        Δcontainer(0);
      }
      if (rf & RenderFlags.Update) {
        ΔcontainerRefreshStart(0);
        {
          for (let i = 0; i < 2; i++) {
            let rf1 = ΔembeddedViewStart(0, 1, 4);
            if (rf1 & RenderFlags.Create) {
              ΔelementStart(0, 'object-comp');
              objectComps.push(getDirectiveOnNode(0));
              ΔelementEnd();
            }
            if (rf1 & RenderFlags.Update) {
              ΔelementProperty(
                  0, 'config',
                  Δbind(ΔpureFunction2(1, e0_ff, ctx.configs[i].opacity, ctx.configs[i].duration)));
            }
            ΔembeddedViewEnd();
          }
        }
        ΔcontainerRefreshEnd();
      }
    }

    const e0_ff = (v1: any, v2: any) => { return {opacity: v1, duration: v2}; };

    const configs = [{opacity: 0, duration: 500}, {opacity: 1, duration: 600}];
    renderToHtml(Template, {configs}, 1, 0, defs);
    expect(objectComps[0].config).toEqual({opacity: 0, duration: 500});
    expect(objectComps[1].config).toEqual({opacity: 1, duration: 600});

    configs[0].duration = 1000;
    renderToHtml(Template, {configs}, 1, 0, defs);
    expect(objectComps[0].config).toEqual({opacity: 0, duration: 1000});
    expect(objectComps[1].config).toEqual({opacity: 1, duration: 600});
  });

});
