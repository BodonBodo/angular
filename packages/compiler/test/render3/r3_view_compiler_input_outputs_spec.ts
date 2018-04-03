/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {MockDirectory, setup} from '../aot/test_util';
import {compile, expectEmit} from './mock_compile';

describe('compiler compliance: listen()', () => {
  const angularFiles = setup({
    compileAngular: true,
    compileAnimations: false,
    compileCommon: true,
  });

  it('should create declare inputs/outputs', () => {
    const files = {
      app: {
        'spec.ts': `
              import {Component, Directive, NgModule, Input, Output} from '@angular/core';

              @Component({
                selector: 'my-component',
                template: \`\`
              })
              export class MyComponent {
                @Input() componentInput;
                @Input('renamedComponentInput') originalComponentInput;

                @Output() componentOutput;
                @Output('renamedComponentOutput') originalComponentOutput;
              }

              @Directive({
                selector: '[my-directive]',
              })
              export class MyDirective {
                @Input() directiveInput;
                @Input('renamedDirectiveInput') originalDirectiveInput;

                @Output() directiveOutput;
                @Output('renamedDirectiveOutput') originalDirectiveOutput;
              }

              @NgModule({declarations: [MyComponent, MyDirective]})
              export class MyModule {}
          `
      }
    };

    // The template should look like this (where IDENT is a wild card for an identifier):
    const template = `
      static ngComponentDef = i0.ɵdefineComponent({
          …
          inputs:{
            componentInput: 'componentInput',
            originalComponentInput: 'renamedComponentInput'
          },
          outputs: {
            componentOutput: 'componentOutput',
            originalComponentOutput: 'renamedComponentOutput'
          }
        });
        …
        static ngDirectiveDef = i0.ɵdefineDirective({
        …
        inputs:{
          directiveInput: 'directiveInput',
          originalDirectiveInput: 'renamedDirectiveInput'
        },
        outputs: {
          directiveOutput: 'directiveOutput',
          originalDirectiveOutput: 'renamedDirectiveOutput'
        }
      });`;


    const result = compile(files, angularFiles);

    expectEmit(result.source, template, 'Incorrect template');
  });

});