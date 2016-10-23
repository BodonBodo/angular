/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, Directive, ElementRef, Injectable, Renderer} from '@angular/core';

// A service available to the Injector, used by the HelloCmp component.
@Injectable()
export class GreetingService {
  greeting: string = 'hello';
}

// Directives are light-weight. They don't allow new
// expression contexts (use @Component for those needs).
@Directive({selector: '[red]'})
export class RedDec {
  // ElementRef is always injectable and it wraps the element on which the
  // directive was found by the compiler.
  constructor(el: ElementRef, renderer: Renderer) {
    renderer.setElementStyle(el.nativeElement, 'color', 'red');
  }
}

// Angular 2.0 supports 2 basic types of directives:
// - Component - the basic building blocks of Angular 2.0 apps. Backed by
//   ShadowDom.(http://www.html5rocks.com/en/tutorials/webcomponents/shadowdom/)
// - Directive - add behavior to existing elements.

@Component({
  // The Selector prop tells Angular on which elements to instantiate this
  // class. The syntax supported is a basic subset of CSS selectors, for example
  // 'element', '[attr]', [attr=foo]', etc.
  selector: 'hello-app',
  // These are services that would be created if a class in the component's
  // template tries to inject them.
  viewProviders: [GreetingService],
  // The template for the component.
  // Expressions in the template (like {{greeting}}) are evaluated in the
  // context of the HelloCmp class below.
  template: `<div class="greeting">{{greeting}} <span red>world</span>!</div>
           <button class="changeButton" (click)="changeGreeting()">change greeting</button>
           <div (keydown)="onKeyDown($event)" class="sample-area" tabindex="0">{{lastKey}}</div><br>`
})
export class HelloCmp {
  greeting: string;
  lastKey: string = '(none)';

  constructor(service: GreetingService) { this.greeting = service.greeting; }

  changeGreeting(): void { this.greeting = 'howdy'; }

  onKeyDown(event: KeyboardEvent): void { this.lastKey = String.fromCharCode(event.keyCode); }
}
