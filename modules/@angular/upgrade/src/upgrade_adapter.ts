/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Compiler, ComponentFactory, Injector, NgModule, NgModuleRef, NgZone, Provider, Testability, Type} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import * as angular from './angular_js';
import {NG1_COMPILE, NG1_INJECTOR, NG1_PARSE, NG1_ROOT_SCOPE, NG1_TESTABILITY, NG2_COMPILER, NG2_COMPONENT_FACTORY_REF_MAP, NG2_INJECTOR, NG2_ZONE, REQUIRE_INJECTOR} from './constants';
import {DowngradeNg2ComponentAdapter} from './downgrade_ng2_adapter';
import {ComponentInfo, getComponentInfo} from './metadata';
import {UpgradeNg1ComponentAdapterBuilder} from './upgrade_ng1_adapter';
import {controllerKey, onError} from './util';

var upgradeCount: number = 0;

/**
 * Use `UpgradeAdapter` to allow AngularJS v1 and Angular v2 to coexist in a single application.
 *
 * The `UpgradeAdapter` allows:
 * 1. creation of Angular v2 component from AngularJS v1 component directive
 *    (See [UpgradeAdapter#upgradeNg1Component()])
 * 2. creation of AngularJS v1 directive from Angular v2 component.
 *    (See [UpgradeAdapter#downgradeNg2Component()])
 * 3. Bootstrapping of a hybrid Angular application which contains both of the frameworks
 *    coexisting in a single application.
 *
 * ## Mental Model
 *
 * When reasoning about how a hybrid application works it is useful to have a mental model which
 * describes what is happening and explains what is happening at the lowest level.
 *
 * 1. There are two independent frameworks running in a single application, each framework treats
 *    the other as a black box.
 * 2. Each DOM element on the page is owned exactly by one framework. Whichever framework
 *    instantiated the element is the owner. Each framework only updates/interacts with its own
 *    DOM elements and ignores others.
 * 3. AngularJS v1 directives always execute inside AngularJS v1 framework codebase regardless of
 *    where they are instantiated.
 * 4. Angular v2 components always execute inside Angular v2 framework codebase regardless of
 *    where they are instantiated.
 * 5. An AngularJS v1 component can be upgraded to an Angular v2 component. This creates an
 *    Angular v2 directive, which bootstraps the AngularJS v1 component directive in that location.
 * 6. An Angular v2 component can be downgraded to an AngularJS v1 component directive. This creates
 *    an AngularJS v1 directive, which bootstraps the Angular v2 component in that location.
 * 7. Whenever an adapter component is instantiated the host element is owned by the framework
 *    doing the instantiation. The other framework then instantiates and owns the view for that
 *    component. This implies that component bindings will always follow the semantics of the
 *    instantiation framework. The syntax is always that of Angular v2 syntax.
 * 8. AngularJS v1 is always bootstrapped first and owns the bottom most view.
 * 9. The new application is running in Angular v2 zone, and therefore it no longer needs calls to
 *    `$apply()`.
 *
 * ### Example
 *
 * ```
 * var adapter = new UpgradeAdapter(forwardRef(() => MyNg2Module));
 * var module = angular.module('myExample', []);
 * module.directive('ng2Comp', adapter.downgradeNg2Component(Ng2Component));
 *
 * module.directive('ng1Hello', function() {
 *   return {
 *      scope: { title: '=' },
 *      template: 'ng1[Hello {{title}}!](<span ng-transclude></span>)'
 *   };
 * });
 *
 *
 * @Component({
 *   selector: 'ng2-comp',
 *   inputs: ['name'],
 *   template: 'ng2[<ng1-hello [title]="name">transclude</ng1-hello>](<ng-content></ng-content>)',
 *   directives:
 * })
 * class Ng2Component {
 * }
 *
 * @NgModule({
 *   declarations: [Ng2Component, adapter.upgradeNg1Component('ng1Hello')],
 *   imports: [BrowserModule]
 * })
 * class MyNg2Module {}
 *
 *
 * document.body.innerHTML = '<ng2-comp name="World">project</ng2-comp>';
 *
 * adapter.bootstrap(document.body, ['myExample']).ready(function() {
 *   expect(document.body.textContent).toEqual(
 *       "ng2[ng1[Hello World!](transclude)](project)");
 * });
 *
 * ```
 *
 * @stable
 */
export class UpgradeAdapter {
  /* @internal */
  private idPrefix: string = `NG2_UPGRADE_${upgradeCount++}_`;
  /* @internal */
  private upgradedComponents: Type<any>[] = [];
  /**
   * An internal map of ng1 components which need to up upgraded to ng2.
   *
   * We can't upgrade until injector is instantiated and we can retrieve the component metadata.
   * For this reason we keep a list of components to upgrade until ng1 injector is bootstrapped.
   *
   * @internal
   */
  private ng1ComponentsToBeUpgraded: {[name: string]: UpgradeNg1ComponentAdapterBuilder} = {};
  /* @internal */
  private providers: Provider[] = [];

  constructor(private ng2AppModule: Type<any>) {
    if (!ng2AppModule) {
      throw new Error(
          'UpgradeAdapter cannot be instantiated without an NgModule of the Angular 2 app.');
    }
  }

  /**
   * Allows Angular v2 Component to be used from AngularJS v1.
   *
   * Use `downgradeNg2Component` to create an AngularJS v1 Directive Definition Factory from
   * Angular v2 Component. The adapter will bootstrap Angular v2 component from within the
   * AngularJS v1 template.
   *
   * ## Mental Model
   *
   * 1. The component is instantiated by being listed in AngularJS v1 template. This means that the
   *    host element is controlled by AngularJS v1, but the component's view will be controlled by
   *    Angular v2.
   * 2. Even thought the component is instantiated in AngularJS v1, it will be using Angular v2
   *    syntax. This has to be done, this way because we must follow Angular v2 components do not
   *    declare how the attributes should be interpreted.
   *
   * ## Supported Features
   *
   * - Bindings:
   *   - Attribute: `<comp name="World">`
   *   - Interpolation:  `<comp greeting="Hello {{name}}!">`
   *   - Expression:  `<comp [name]="username">`
   *   - Event:  `<comp (close)="doSomething()">`
   * - Content projection: yes
   *
   * ### Example
   *
   * ```
   * var adapter = new UpgradeAdapter(forwardRef(() => MyNg2Module));
   * var module = angular.module('myExample', []);
   * module.directive('greet', adapter.downgradeNg2Component(Greeter));
   *
   * @Component({
   *   selector: 'greet',
   *   template: '{{salutation}} {{name}}! - <ng-content></ng-content>'
   * })
   * class Greeter {
   *   @Input() salutation: string;
   *   @Input() name: string;
   * }
   *
   * @NgModule({
   *   declarations: [Greeter],
   *   imports: [BrowserModule]
   * })
   * class MyNg2Module {}
   *
   * document.body.innerHTML =
   *   'ng1 template: <greet salutation="Hello" [name]="world">text</greet>';
   *
   * adapter.bootstrap(document.body, ['myExample']).ready(function() {
   *   expect(document.body.textContent).toEqual("ng1 template: Hello world! - text");
   * });
   * ```
   */
  downgradeNg2Component(type: Type<any>): Function {
    this.upgradedComponents.push(type);
    var info: ComponentInfo = getComponentInfo(type);
    return ng1ComponentDirective(info, `${this.idPrefix}${info.selector}_c`);
  }

  /**
   * Allows AngularJS v1 Component to be used from Angular v2.
   *
   * Use `upgradeNg1Component` to create an Angular v2 component from AngularJS v1 Component
   * directive. The adapter will bootstrap AngularJS v1 component from within the Angular v2
   * template.
   *
   * ## Mental Model
   *
   * 1. The component is instantiated by being listed in Angular v2 template. This means that the
   *    host element is controlled by Angular v2, but the component's view will be controlled by
   *    AngularJS v1.
   *
   * ## Supported Features
   *
   * - Bindings:
   *   - Attribute: `<comp name="World">`
   *   - Interpolation:  `<comp greeting="Hello {{name}}!">`
   *   - Expression:  `<comp [name]="username">`
   *   - Event:  `<comp (close)="doSomething()">`
   * - Transclusion: yes
   * - Only some of the features of
   *   [Directive Definition Object](https://docs.angularjs.org/api/ng/service/$compile) are
   *   supported:
   *   - `compile`: not supported because the host element is owned by Angular v2, which does
   *     not allow modifying DOM structure during compilation.
   *   - `controller`: supported. (NOTE: injection of `$attrs` and `$transclude` is not supported.)
   *   - `controllerAs': supported.
   *   - `bindToController': supported.
   *   - `link': supported. (NOTE: only pre-link function is supported.)
   *   - `name': supported.
   *   - `priority': ignored.
   *   - `replace': not supported.
   *   - `require`: supported.
   *   - `restrict`: must be set to 'E'.
   *   - `scope`: supported.
   *   - `template`: supported.
   *   - `templateUrl`: supported.
   *   - `terminal`: ignored.
   *   - `transclude`: supported.
   *
   *
   * ### Example
   *
   * ```
   * var adapter = new UpgradeAdapter(forwardRef(() => MyNg2Module));
   * var module = angular.module('myExample', []);
   *
   * module.directive('greet', function() {
   *   return {
   *     scope: {salutation: '=', name: '=' },
   *     template: '{{salutation}} {{name}}! - <span ng-transclude></span>'
   *   };
   * });
   *
   * module.directive('ng2', adapter.downgradeNg2Component(Ng2Component));
   *
   * @Component({
   *   selector: 'ng2',
   *   template: 'ng2 template: <greet salutation="Hello" [name]="world">text</greet>'
   * })
   * class Ng2Component {
   * }
   *
   * @NgModule({
   *   declarations: [Ng2Component, adapter.upgradeNg1Component('greet')],
   *   imports: [BrowserModule]
   * })
   * class MyNg2Module {}
   *
   * document.body.innerHTML = '<ng2></ng2>';
   *
   * adapter.bootstrap(document.body, ['myExample']).ready(function() {
   *   expect(document.body.textContent).toEqual("ng2 template: Hello world! - text");
   * });
   * ```
   */
  upgradeNg1Component(name: string): Type<any> {
    if ((<any>this.ng1ComponentsToBeUpgraded).hasOwnProperty(name)) {
      return this.ng1ComponentsToBeUpgraded[name].type;
    } else {
      return (this.ng1ComponentsToBeUpgraded[name] = new UpgradeNg1ComponentAdapterBuilder(name))
          .type;
    }
  }

  /**
   * Bootstrap a hybrid AngularJS v1 / Angular v2 application.
   *
   * This `bootstrap` method is a direct replacement (takes same arguments) for AngularJS v1
   * [`bootstrap`](https://docs.angularjs.org/api/ng/function/angular.bootstrap) method. Unlike
   * AngularJS v1, this bootstrap is asynchronous.
   *
   * ### Example
   *
   * ```
   * var adapter = new UpgradeAdapter();
   * var module = angular.module('myExample', []);
   * module.directive('ng2', adapter.downgradeNg2Component(Ng2));
   *
   * module.directive('ng1', function() {
   *   return {
   *      scope: { title: '=' },
   *      template: 'ng1[Hello {{title}}!](<span ng-transclude></span>)'
   *   };
   * });
   *
   *
   * @Component({
   *   selector: 'ng2',
   *   inputs: ['name'],
   *   template: 'ng2[<ng1 [title]="name">transclude</ng1>](<ng-content></ng-content>)'
   * })
   * class Ng2 {
   * }
   *
   * @NgModule({
   *   declarations: [Ng2, adapter.upgradeNg1Component('ng1')],
   *   imports: [BrowserModule]
   * })
   * class MyNg2Module {}
   *
   * document.body.innerHTML = '<ng2 name="World">project</ng2>';
   *
   * adapter.bootstrap(document.body, ['myExample']).ready(function() {
   *   expect(document.body.textContent).toEqual(
   *       "ng2[ng1[Hello World!](transclude)](project)");
   * });
   * ```
   */
  bootstrap(element: Element, modules?: any[], config?: angular.IAngularBootstrapConfig):
      UpgradeAdapterRef {
    const ngZone =
        new NgZone({enableLongStackTrace: Zone.hasOwnProperty('longStackTraceZoneSpec')});
    var upgrade = new UpgradeAdapterRef();
    var ng1Injector: angular.IInjectorService = null;
    var moduleRef: NgModuleRef<any> = null;
    var delayApplyExps: Function[] = [];
    var original$applyFn: Function;
    var rootScopePrototype: any;
    var rootScope: angular.IRootScopeService;
    var componentFactoryRefMap: ComponentFactoryRefMap = {};
    var ng1Module = angular.module(this.idPrefix, modules);
    var ng1BootstrapPromise: Promise<any>;
    var ng1compilePromise: Promise<any>;
    ng1Module.factory(NG2_INJECTOR, () => moduleRef.injector.get(Injector))
        .value(NG2_ZONE, ngZone)
        .factory(NG2_COMPILER, () => moduleRef.injector.get(Compiler))
        .value(NG2_COMPONENT_FACTORY_REF_MAP, componentFactoryRefMap)
        .config([
          '$provide', '$injector',
          (provide: any /** TODO #???? */, ng1Injector: angular.IInjectorService) => {
            provide.decorator(NG1_ROOT_SCOPE, [
              '$delegate',
              function(rootScopeDelegate: angular.IRootScopeService) {
                // Capture the root apply so that we can delay first call to $apply until we
                // bootstrap Angular 2 and then we replay and restore the $apply.
                rootScopePrototype = rootScopeDelegate.constructor.prototype;
                if (rootScopePrototype.hasOwnProperty('$apply')) {
                  original$applyFn = rootScopePrototype.$apply;
                  rootScopePrototype.$apply = (exp: any) => delayApplyExps.push(exp);
                } else {
                  throw new Error('Failed to find \'$apply\' on \'$rootScope\'!');
                }
                return rootScope = rootScopeDelegate;
              }
            ]);
            if (ng1Injector.has(NG1_TESTABILITY)) {
              provide.decorator(NG1_TESTABILITY, [
                '$delegate',
                function(testabilityDelegate: angular.ITestabilityService) {

                  var originalWhenStable: Function = testabilityDelegate.whenStable;
                  var newWhenStable = (callback: Function): void => {
                    var whenStableContext: any = this;
                    originalWhenStable.call(this, function() {
                      var ng2Testability: Testability = moduleRef.injector.get(Testability);
                      if (ng2Testability.isStable()) {
                        callback.apply(this, arguments);
                      } else {
                        ng2Testability.whenStable(newWhenStable.bind(whenStableContext, callback));
                      }
                    });
                  };

                  testabilityDelegate.whenStable = newWhenStable;
                  return testabilityDelegate;
                }
              ]);
            }
          }
        ]);

    ng1compilePromise = new Promise((resolve, reject) => {
      ng1Module.run([
        '$injector', '$rootScope',
        (injector: angular.IInjectorService, rootScope: angular.IRootScopeService) => {
          ng1Injector = injector;
          UpgradeNg1ComponentAdapterBuilder.resolve(this.ng1ComponentsToBeUpgraded, injector)
              .then(() => {
                // At this point we have ng1 injector and we have lifted ng1 components into ng2, we
                // now can bootstrap ng2.
                var DynamicNgUpgradeModule =
                    NgModule({
                      providers: [
                        {provide: NG1_INJECTOR, useFactory: () => ng1Injector},
                        {provide: NG1_COMPILE, useFactory: () => ng1Injector.get(NG1_COMPILE)},
                        this.providers
                      ],
                      imports: [this.ng2AppModule]
                    }).Class({
                      constructor: function DynamicNgUpgradeModule() {},
                      ngDoBootstrap: function() {}
                    });

                (platformBrowserDynamic() as any)
                    ._bootstrapModuleWithZone(
                        DynamicNgUpgradeModule, undefined, ngZone,
                        (componentFactories: ComponentFactory<any>[]) => {
                          componentFactories.forEach((componentFactory: ComponentFactory<any>) => {
                            var type: Type<any> = componentFactory.componentType;
                            if (this.upgradedComponents.indexOf(type) !== -1) {
                              componentFactoryRefMap[getComponentInfo(type).selector] =
                                  componentFactory;
                            }
                          });
                        })
                    .then((ref: NgModuleRef<any>) => {
                      moduleRef = ref;
                      angular.element(element).data(
                          controllerKey(NG2_INJECTOR), moduleRef.injector);
                      ngZone.onMicrotaskEmpty.subscribe({
                        next: (_: any) => ngZone.runOutsideAngular(() => rootScope.$evalAsync())
                      });
                    })
                    .then(resolve, reject);
              });
        }
      ]);
    });

    // Make sure resumeBootstrap() only exists if the current bootstrap is deferred
    var windowAngular = (window as any /** TODO #???? */)['angular'];
    windowAngular.resumeBootstrap = undefined;

    ngZone.run(() => { angular.bootstrap(element, [this.idPrefix], config); });
    ng1BootstrapPromise = new Promise((resolve) => {
      if (windowAngular.resumeBootstrap) {
        var originalResumeBootstrap: () => void = windowAngular.resumeBootstrap;
        windowAngular.resumeBootstrap = function() {
          windowAngular.resumeBootstrap = originalResumeBootstrap;
          windowAngular.resumeBootstrap.apply(this, arguments);
          resolve();
        };
      } else {
        resolve();
      }
    });

    Promise.all([ng1BootstrapPromise, ng1compilePromise]).then(() => {
      moduleRef.injector.get(NgZone).run(() => {
        if (rootScopePrototype) {
          rootScopePrototype.$apply = original$applyFn;  // restore original $apply
          while (delayApplyExps.length) {
            rootScope.$apply(delayApplyExps.shift());
          }
          (<any>upgrade)._bootstrapDone(moduleRef, ng1Injector);
          rootScopePrototype = null;
        }
      });
    }, onError);
    return upgrade;
  }

  /**
   * Allows AngularJS v1 service to be accessible from Angular v2.
   *
   *
   * ### Example
   *
   * ```
   * class Login { ... }
   * class Server { ... }
   *
   * @Injectable()
   * class Example {
   *   constructor(@Inject('server') server, login: Login) {
   *     ...
   *   }
   * }
   *
   * var module = angular.module('myExample', []);
   * module.service('server', Server);
   * module.service('login', Login);
   *
   * var adapter = new UpgradeAdapter();
   * adapter.upgradeNg1Provider('server');
   * adapter.upgradeNg1Provider('login', {asToken: Login});
   *
   * adapter.bootstrap(document.body, ['myExample']).ready((ref) => {
   *   var example: Example = ref.ng2Injector.get(Example);
   * });
   *
   * ```
   */
  public upgradeNg1Provider(name: string, options?: {asToken: any}) {
    var token = options && options.asToken || name;
    this.providers.push({
      provide: token,
      useFactory: (ng1Injector: angular.IInjectorService) => ng1Injector.get(name),
      deps: [NG1_INJECTOR]
    });
  }

  /**
   * Allows Angular v2 service to be accessible from AngularJS v1.
   *
   *
   * ### Example
   *
   * ```
   * class Example {
   * }
   *
   * var adapter = new UpgradeAdapter();
   *
   * var module = angular.module('myExample', []);
   * module.factory('example', adapter.downgradeNg2Provider(Example));
   *
   * adapter.bootstrap(document.body, ['myExample']).ready((ref) => {
   *   var example: Example = ref.ng1Injector.get('example');
   * });
   *
   * ```
   */
  public downgradeNg2Provider(token: any): Function {
    var factory = function(injector: Injector) { return injector.get(token); };
    (<any>factory).$inject = [NG2_INJECTOR];
    return factory;
  }
}

interface ComponentFactoryRefMap {
  [selector: string]: ComponentFactory<any>;
}

function ng1ComponentDirective(info: ComponentInfo, idPrefix: string): Function {
  (<any>directiveFactory).$inject = [NG1_INJECTOR, NG2_COMPONENT_FACTORY_REF_MAP, NG1_PARSE];
  function directiveFactory(
      ng1Injector: angular.IInjectorService, componentFactoryRefMap: ComponentFactoryRefMap,
      parse: angular.IParseService): angular.IDirective {
    var idCount = 0;
    return {
      restrict: 'E',
      require: REQUIRE_INJECTOR,
      link: {
        post: (scope: angular.IScope, element: angular.IAugmentedJQuery, attrs: angular.IAttributes,
               parentInjector: any, transclude: angular.ITranscludeFunction): void => {
          var componentFactory: ComponentFactory<any> = componentFactoryRefMap[info.selector];
          if (!componentFactory)
            throw new Error('Expecting ComponentFactory for: ' + info.selector);

          if (parentInjector === null) {
            parentInjector = ng1Injector.get(NG2_INJECTOR);
          }
          var facade = new DowngradeNg2ComponentAdapter(
              idPrefix + (idCount++), info, element, attrs, scope, <Injector>parentInjector, parse,
              componentFactory);
          facade.setupInputs();
          facade.bootstrapNg2();
          facade.projectContent();
          facade.setupOutputs();
          facade.registerCleanup();
        }
      }
    };
  }
  return directiveFactory;
}

/**
 * Use `UpgradeAdapterRef` to control a hybrid AngularJS v1 / Angular v2 application.
 *
 * @stable
 */
export class UpgradeAdapterRef {
  /* @internal */
  private _readyFn: (upgradeAdapterRef?: UpgradeAdapterRef) => void = null;

  public ng1RootScope: angular.IRootScopeService = null;
  public ng1Injector: angular.IInjectorService = null;
  public ng2ModuleRef: NgModuleRef<any> = null;
  public ng2Injector: Injector = null;

  /* @internal */
  private _bootstrapDone(ngModuleRef: NgModuleRef<any>, ng1Injector: angular.IInjectorService) {
    this.ng2ModuleRef = ngModuleRef;
    this.ng2Injector = ngModuleRef.injector;
    this.ng1Injector = ng1Injector;
    this.ng1RootScope = ng1Injector.get(NG1_ROOT_SCOPE);
    this._readyFn && this._readyFn(this);
  }

  /**
   * Register a callback function which is notified upon successful hybrid AngularJS v1 / Angular v2
   * application has been bootstrapped.
   *
   * The `ready` callback function is invoked inside the Angular v2 zone, therefore it does not
   * require a call to `$apply()`.
   */
  public ready(fn: (upgradeAdapterRef?: UpgradeAdapterRef) => void) { this._readyFn = fn; }

  /**
   * Dispose of running hybrid AngularJS v1 / Angular v2 application.
   */
  public dispose() {
    this.ng1Injector.get(NG1_ROOT_SCOPE).$destroy();
    this.ng2ModuleRef.destroy();
  }
}
