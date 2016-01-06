import {Map, MapWrapper, ListWrapper} from 'angular2/src/facade/collection';
import {
  ResolvedProvider,
  Provider,
  Dependency,
  ProviderBuilder,
  ResolvedFactory,
  provide,
  resolveProviders
} from './provider';
import {
  AbstractProviderError,
  NoProviderError,
  CyclicDependencyError,
  InstantiationError,
  InvalidProviderError,
  OutOfBoundsError
} from './exceptions';
import {Type, CONST_EXPR} from 'angular2/src/facade/lang';
import {BaseException, unimplemented} from 'angular2/src/facade/exceptions';
import {Key} from './key';
import {SelfMetadata, HostMetadata, SkipSelfMetadata} from './metadata';

var __unused: Type;  // avoid unused import when Type union types are erased

// Threshold for the dynamic version
const _MAX_CONSTRUCTION_COUNTER = 10;

export const UNDEFINED: Object = CONST_EXPR(new Object());

export interface ProtoInjectorStrategy {
  getProviderAtIndex(index: number): ResolvedProvider;
  createInjectorStrategy(inj: Injector_): InjectorStrategy;
}

export class ProtoInjectorInlineStrategy implements ProtoInjectorStrategy {
  provider0: ResolvedProvider = null;
  provider1: ResolvedProvider = null;
  provider2: ResolvedProvider = null;
  provider3: ResolvedProvider = null;
  provider4: ResolvedProvider = null;
  provider5: ResolvedProvider = null;
  provider6: ResolvedProvider = null;
  provider7: ResolvedProvider = null;
  provider8: ResolvedProvider = null;
  provider9: ResolvedProvider = null;

  keyId0: number = null;
  keyId1: number = null;
  keyId2: number = null;
  keyId3: number = null;
  keyId4: number = null;
  keyId5: number = null;
  keyId6: number = null;
  keyId7: number = null;
  keyId8: number = null;
  keyId9: number = null;

  constructor(protoEI: ProtoInjector, providers: ResolvedProvider[]) {
    var length = providers.length;

    if (length > 0) {
      this.provider0 = providers[0];
      this.keyId0 = providers[0].key.id;
    }
    if (length > 1) {
      this.provider1 = providers[1];
      this.keyId1 = providers[1].key.id;
    }
    if (length > 2) {
      this.provider2 = providers[2];
      this.keyId2 = providers[2].key.id;
    }
    if (length > 3) {
      this.provider3 = providers[3];
      this.keyId3 = providers[3].key.id;
    }
    if (length > 4) {
      this.provider4 = providers[4];
      this.keyId4 = providers[4].key.id;
    }
    if (length > 5) {
      this.provider5 = providers[5];
      this.keyId5 = providers[5].key.id;
    }
    if (length > 6) {
      this.provider6 = providers[6];
      this.keyId6 = providers[6].key.id;
    }
    if (length > 7) {
      this.provider7 = providers[7];
      this.keyId7 = providers[7].key.id;
    }
    if (length > 8) {
      this.provider8 = providers[8];
      this.keyId8 = providers[8].key.id;
    }
    if (length > 9) {
      this.provider9 = providers[9];
      this.keyId9 = providers[9].key.id;
    }
  }

  getProviderAtIndex(index: number): ResolvedProvider {
    if (index == 0) return this.provider0;
    if (index == 1) return this.provider1;
    if (index == 2) return this.provider2;
    if (index == 3) return this.provider3;
    if (index == 4) return this.provider4;
    if (index == 5) return this.provider5;
    if (index == 6) return this.provider6;
    if (index == 7) return this.provider7;
    if (index == 8) return this.provider8;
    if (index == 9) return this.provider9;
    throw new OutOfBoundsError(index);
  }

  createInjectorStrategy(injector: Injector_): InjectorStrategy {
    return new InjectorInlineStrategy(injector, this);
  }
}

export class ProtoInjectorDynamicStrategy implements ProtoInjectorStrategy {
  keyIds: number[];

  constructor(protoInj: ProtoInjector, public providers: ResolvedProvider[]) {
    var len = providers.length;

    this.keyIds = ListWrapper.createFixedSize(len);

    for (var i = 0; i < len; i++) {
      this.keyIds[i] = providers[i].key.id;
    }
  }

  getProviderAtIndex(index: number): ResolvedProvider {
    if (index < 0 || index >= this.providers.length) {
      throw new OutOfBoundsError(index);
    }
    return this.providers[index];
  }

  createInjectorStrategy(ei: Injector_): InjectorStrategy {
    return new InjectorDynamicStrategy(this, ei);
  }
}

export class ProtoInjector {
  static fromResolvedProviders(providers: ResolvedProvider[]): ProtoInjector {
    return new ProtoInjector(providers);
  }

  /** @internal */
  _strategy: ProtoInjectorStrategy;
  numberOfProviders: number;

  constructor(providers: ResolvedProvider[]) {
    this.numberOfProviders = providers.length;
    this._strategy = providers.length > _MAX_CONSTRUCTION_COUNTER ?
                         new ProtoInjectorDynamicStrategy(this, providers) :
                         new ProtoInjectorInlineStrategy(this, providers);
  }

  getProviderAtIndex(index: number): ResolvedProvider {
    return this._strategy.getProviderAtIndex(index);
  }
}



export interface InjectorStrategy {
  getObjByKeyId(keyId: number): any;
  getObjAtIndex(index: number): any;
  getMaxNumberOfObjects(): number;

  resetConstructionCounter(): void;
  instantiateProvider(provider: ResolvedProvider): any;
}

export class InjectorInlineStrategy implements InjectorStrategy {
  obj0: any = UNDEFINED;
  obj1: any = UNDEFINED;
  obj2: any = UNDEFINED;
  obj3: any = UNDEFINED;
  obj4: any = UNDEFINED;
  obj5: any = UNDEFINED;
  obj6: any = UNDEFINED;
  obj7: any = UNDEFINED;
  obj8: any = UNDEFINED;
  obj9: any = UNDEFINED;

  constructor(public injector: Injector_, public protoStrategy: ProtoInjectorInlineStrategy) {}

  resetConstructionCounter(): void { this.injector._constructionCounter = 0; }

  instantiateProvider(provider: ResolvedProvider): any { return this.injector._new(provider); }

  getObjByKeyId(keyId: number): any {
    var p = this.protoStrategy;
    var inj = this.injector;

    if (p.keyId0 === keyId) {
      if (this.obj0 === UNDEFINED) {
        this.obj0 = inj._new(p.provider0);
      }
      return this.obj0;
    }
    if (p.keyId1 === keyId) {
      if (this.obj1 === UNDEFINED) {
        this.obj1 = inj._new(p.provider1);
      }
      return this.obj1;
    }
    if (p.keyId2 === keyId) {
      if (this.obj2 === UNDEFINED) {
        this.obj2 = inj._new(p.provider2);
      }
      return this.obj2;
    }
    if (p.keyId3 === keyId) {
      if (this.obj3 === UNDEFINED) {
        this.obj3 = inj._new(p.provider3);
      }
      return this.obj3;
    }
    if (p.keyId4 === keyId) {
      if (this.obj4 === UNDEFINED) {
        this.obj4 = inj._new(p.provider4);
      }
      return this.obj4;
    }
    if (p.keyId5 === keyId) {
      if (this.obj5 === UNDEFINED) {
        this.obj5 = inj._new(p.provider5);
      }
      return this.obj5;
    }
    if (p.keyId6 === keyId) {
      if (this.obj6 === UNDEFINED) {
        this.obj6 = inj._new(p.provider6);
      }
      return this.obj6;
    }
    if (p.keyId7 === keyId) {
      if (this.obj7 === UNDEFINED) {
        this.obj7 = inj._new(p.provider7);
      }
      return this.obj7;
    }
    if (p.keyId8 === keyId) {
      if (this.obj8 === UNDEFINED) {
        this.obj8 = inj._new(p.provider8);
      }
      return this.obj8;
    }
    if (p.keyId9 === keyId) {
      if (this.obj9 === UNDEFINED) {
        this.obj9 = inj._new(p.provider9);
      }
      return this.obj9;
    }

    return UNDEFINED;
  }

  getObjAtIndex(index: number): any {
    if (index == 0) return this.obj0;
    if (index == 1) return this.obj1;
    if (index == 2) return this.obj2;
    if (index == 3) return this.obj3;
    if (index == 4) return this.obj4;
    if (index == 5) return this.obj5;
    if (index == 6) return this.obj6;
    if (index == 7) return this.obj7;
    if (index == 8) return this.obj8;
    if (index == 9) return this.obj9;
    throw new OutOfBoundsError(index);
  }

  getMaxNumberOfObjects(): number { return _MAX_CONSTRUCTION_COUNTER; }
}


export class InjectorDynamicStrategy implements InjectorStrategy {
  objs: any[];

  constructor(public protoStrategy: ProtoInjectorDynamicStrategy, public injector: Injector_) {
    this.objs = ListWrapper.createFixedSize(protoStrategy.providers.length);
    ListWrapper.fill(this.objs, UNDEFINED);
  }

  resetConstructionCounter(): void { this.injector._constructionCounter = 0; }

  instantiateProvider(provider: ResolvedProvider): any { return this.injector._new(provider); }

  getObjByKeyId(keyId: number): any {
    var p = this.protoStrategy;

    for (var i = 0; i < p.keyIds.length; i++) {
      if (p.keyIds[i] === keyId) {
        if (this.objs[i] === UNDEFINED) {
          this.objs[i] = this.injector._new(p.providers[i]);
        }

        return this.objs[i];
      }
    }

    return UNDEFINED;
  }

  getObjAtIndex(index: number): any {
    if (index < 0 || index >= this.objs.length) {
      throw new OutOfBoundsError(index);
    }

    return this.objs[index];
  }

  getMaxNumberOfObjects(): number { return this.objs.length; }
}

/**
 * Used to provide dependencies that cannot be easily expressed as providers.
 */
export interface DependencyProvider {
  getDependency(injector: Injector, provider: ResolvedProvider, dependency: Dependency): any;
}

export abstract class Injector {
  /**
   * Turns an array of provider definitions into an array of resolved providers.
   *
   * A resolution is a process of flattening multiple nested arrays and converting individual
   * providers into an array of {@link ResolvedProvider}s.
   *
   * ### Example ([live demo](http://plnkr.co/edit/AiXTHi?p=preview))
   *
   * ```typescript
   * @Injectable()
   * class Engine {
   * }
   *
   * @Injectable()
   * class Car {
   *   constructor(public engine:Engine) {}
   * }
   *
   * var providers = Injector.resolve([Car, [[Engine]]]);
   *
   * expect(providers.length).toEqual(2);
   *
   * expect(providers[0] instanceof ResolvedProvider).toBe(true);
   * expect(providers[0].key.displayName).toBe("Car");
   * expect(providers[0].dependencies.length).toEqual(1);
   * expect(providers[0].factory).toBeDefined();
   *
   * expect(providers[1].key.displayName).toBe("Engine");
   * });
   * ```
   *
   * See {@link Injector#fromResolvedProviders} for more info.
   */
  static resolve(providers: Array<Type | Provider | any[]>): ResolvedProvider[] {
    return resolveProviders(providers);
  }

  /**
   * Resolves an array of providers and creates an injector from those providers.
   *
   * The passed-in providers can be an array of `Type`, {@link Provider},
   * or a recursive array of more providers.
   *
   * ### Example ([live demo](http://plnkr.co/edit/ePOccA?p=preview))
   *
   * ```typescript
   * @Injectable()
   * class Engine {
   * }
   *
   * @Injectable()
   * class Car {
   *   constructor(public engine:Engine) {}
   * }
   *
   * var injector = Injector.resolveAndCreate([Car, Engine]);
   * expect(injector.get(Car) instanceof Car).toBe(true);
   * ```
   *
   * This function is slower than the corresponding `fromResolvedProviders`
   * because it needs to resolve the passed-in providers first.
   * See {@link Injector#resolve} and {@link Injector#fromResolvedProviders}.
   */
  static resolveAndCreate(providers: Array<Type | Provider | any[]>): Injector {
    var resolvedProviders = Injector.resolve(providers);
    return Injector.fromResolvedProviders(resolvedProviders);
  }

  /**
   * Creates an injector from previously resolved providers.
   *
   * This API is the recommended way to construct injectors in performance-sensitive parts.
   *
   * ### Example ([live demo](http://plnkr.co/edit/KrSMci?p=preview))
   *
   * ```typescript
   * @Injectable()
   * class Engine {
   * }
   *
   * @Injectable()
   * class Car {
   *   constructor(public engine:Engine) {}
   * }
   *
   * var providers = Injector.resolve([Car, Engine]);
   * var injector = Injector.fromResolvedProviders(providers);
   * expect(injector.get(Car) instanceof Car).toBe(true);
   * ```
   */
  static fromResolvedProviders(providers: ResolvedProvider[]): Injector {
    return new Injector_(ProtoInjector.fromResolvedProviders(providers));
  }

  /**
   * @deprecated
   */
  static fromResolvedBindings(providers: ResolvedProvider[]): Injector {
    return Injector.fromResolvedProviders(providers);
  }

  /**
   * Retrieves an instance from the injector based on the provided token.
   * Throws {@link NoProviderError} if not found.
   *
   * ### Example ([live demo](http://plnkr.co/edit/HeXSHg?p=preview))
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([
   *   provide("validToken", {useValue: "Value"})
   * ]);
   * expect(injector.get("validToken")).toEqual("Value");
   * expect(() => injector.get("invalidToken")).toThrowError();
   * ```
   *
   * `Injector` returns itself when given `Injector` as a token.
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([]);
   * expect(injector.get(Injector)).toBe(injector);
   * ```
   */
  get(token: any): any { return unimplemented(); }

  /**
   * Retrieves an instance from the injector based on the provided token.
   * Returns null if not found.
   *
   * ### Example ([live demo](http://plnkr.co/edit/tpEbEy?p=preview))
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([
   *   provide("validToken", {useValue: "Value"})
   * ]);
   * expect(injector.getOptional("validToken")).toEqual("Value");
   * expect(injector.getOptional("invalidToken")).toBe(null);
   * ```
   *
   * `Injector` returns itself when given `Injector` as a token.
   *
   * ```typescript
   * var injector = Injector.resolveAndCreate([]);
   * expect(injector.getOptional(Injector)).toBe(injector);
   * ```
   */
  getOptional(token: any): any { return unimplemented(); }

  /**
   * Parent of this injector.
   *
   * <!-- TODO: Add a link to the section of the user guide talking about hierarchical injection.
   * -->
   *
   * ### Example ([live demo](http://plnkr.co/edit/eosMGo?p=preview))
   *
   * ```typescript
   * var parent = Injector.resolveAndCreate([]);
   * var child = parent.resolveAndCreateChild([]);
   * expect(child.parent).toBe(parent);
   * ```
   */
  get parent(): Injector { return unimplemented(); }

  /**
   * @internal
   */
  debugContext(): any { return null; }

  /**
   * Resolves an array of providers and creates a child injector from those providers.
   *
   * <!-- TODO: Add a link to the section of the user guide talking about hierarchical injection.
   * -->
   *
   * The passed-in providers can be an array of `Type`, {@link Provider},
   * or a recursive array of more providers.
   *
   * ### Example ([live demo](http://plnkr.co/edit/opB3T4?p=preview))
   *
   * ```typescript
   * class ParentProvider {}
   * class ChildProvider {}
   *
   * var parent = Injector.resolveAndCreate([ParentProvider]);
   * var child = parent.resolveAndCreateChild([ChildProvider]);
   *
   * expect(child.get(ParentProvider) instanceof ParentProvider).toBe(true);
   * expect(child.get(ChildProvider) instanceof ChildProvider).toBe(true);
   * expect(child.get(ParentProvider)).toBe(parent.get(ParentProvider));
   * ```
   *
   * This function is slower than the corresponding `createChildFromResolved`
   * because it needs to resolve the passed-in providers first.
   * See {@link Injector#resolve} and {@link Injector#createChildFromResolved}.
   */
  resolveAndCreateChild(providers: Array<Type | Provider | any[]>): Injector {
    return unimplemented();
  }

  /**
   * Creates a child injector from previously resolved providers.
   *
   * <!-- TODO: Add a link to the section of the user guide talking about hierarchical injection.
   * -->
   *
   * This API is the recommended way to construct injectors in performance-sensitive parts.
   *
   * ### Example ([live demo](http://plnkr.co/edit/VhyfjN?p=preview))
   *
   * ```typescript
   * class ParentProvider {}
   * class ChildProvider {}
   *
   * var parentProviders = Injector.resolve([ParentProvider]);
   * var childProviders = Injector.resolve([ChildProvider]);
   *
   * var parent = Injector.fromResolvedProviders(parentProviders);
   * var child = parent.createChildFromResolved(childProviders);
   *
   * expect(child.get(ParentProvider) instanceof ParentProvider).toBe(true);
   * expect(child.get(ChildProvider) instanceof ChildProvider).toBe(true);
   * expect(child.get(ParentProvider)).toBe(parent.get(ParentProvider));
   * ```
   */
  createChildFromResolved(providers: ResolvedProvider[]): Injector { return unimplemented(); }

  /**
   * Resolves a provider and instantiates an object in the context of the injector.
   *
   * The created object does not get cached by the injector.
   *
   * ### Example ([live demo](http://plnkr.co/edit/yvVXoB?p=preview))
   *
   * ```typescript
   * @Injectable()
   * class Engine {
   * }
   *
   * @Injectable()
   * class Car {
   *   constructor(public engine:Engine) {}
   * }
   *
   * var injector = Injector.resolveAndCreate([Engine]);
   *
   * var car = injector.resolveAndInstantiate(Car);
   * expect(car.engine).toBe(injector.get(Engine));
   * expect(car).not.toBe(injector.resolveAndInstantiate(Car));
   * ```
   */
  resolveAndInstantiate(provider: Type | Provider): any { return unimplemented(); }

  /**
   * Instantiates an object using a resolved provider in the context of the injector.
   *
   * The created object does not get cached by the injector.
   *
   * ### Example ([live demo](http://plnkr.co/edit/ptCImQ?p=preview))
   *
   * ```typescript
   * @Injectable()
   * class Engine {
   * }
   *
   * @Injectable()
   * class Car {
   *   constructor(public engine:Engine) {}
   * }
   *
   * var injector = Injector.resolveAndCreate([Engine]);
   * var carProvider = Injector.resolve([Car])[0];
   * var car = injector.instantiateResolved(carProvider);
   * expect(car.engine).toBe(injector.get(Engine));
   * expect(car).not.toBe(injector.instantiateResolved(carProvider));
   * ```
   */
  instantiateResolved(provider: ResolvedProvider): any { return unimplemented(); }
}

/**
 * A dependency injection container used for instantiating objects and resolving dependencies.
 *
 * An `Injector` is a replacement for a `new` operator, which can automatically resolve the
 * constructor dependencies.
 *
 * In typical use, application code asks for the dependencies in the constructor and they are
 * resolved by the `Injector`.
 *
 * ### Example ([live demo](http://plnkr.co/edit/jzjec0?p=preview))
 *
 * The following example creates an `Injector` configured to create `Engine` and `Car`.
 *
 * ```typescript
 * @Injectable()
 * class Engine {
 * }
 *
 * @Injectable()
 * class Car {
 *   constructor(public engine:Engine) {}
 * }
 *
 * var injector = Injector.resolveAndCreate([Car, Engine]);
 * var car = injector.get(Car);
 * expect(car instanceof Car).toBe(true);
 * expect(car.engine instanceof Engine).toBe(true);
 * ```
 *
 * Notice, we don't use the `new` operator because we explicitly want to have the `Injector`
 * resolve all of the object's dependencies automatically.
 */
export class Injector_ implements Injector {
  /** @internal */
  _strategy: InjectorStrategy;
  /** @internal */
  _constructionCounter: number = 0;
  /** @internal */
  public _proto: any /* ProtoInjector */;
  /** @internal */
  public _parent: Injector;
  /**
   * Private
   */
  constructor(_proto: any /* ProtoInjector */, _parent: Injector = null,
              private _debugContext: Function = null) {
    this._proto = _proto;
    this._parent = _parent;
    this._strategy = _proto._strategy.createInjectorStrategy(this);
  }

  /**
   * @internal
   */
  debugContext(): any { return this._debugContext(); }

  get(token: any): any { return this._getByKey(Key.get(token), null, null, false); }

  getOptional(token: any): any { return this._getByKey(Key.get(token), null, null, true); }

  getAt(index: number): any { return this._strategy.getObjAtIndex(index); }

  get parent(): Injector { return this._parent; }

  /**
   * @internal
   * Internal. Do not use.
   * We return `any` not to export the InjectorStrategy type.
   */
  get internalStrategy(): any { return this._strategy; }

  resolveAndCreateChild(providers: Array<Type | Provider | any[]>): Injector {
    var resolvedProviders = Injector.resolve(providers);
    return this.createChildFromResolved(resolvedProviders);
  }

  createChildFromResolved(providers: ResolvedProvider[]): Injector {
    var proto = new ProtoInjector(providers);
    var inj = new Injector_(proto);
    inj._parent = this;
    return inj;
  }

  resolveAndInstantiate(provider: Type | Provider): any {
    return this.instantiateResolved(Injector.resolve([provider])[0]);
  }

  instantiateResolved(provider: ResolvedProvider): any {
    return this._instantiateProvider(provider);
  }

  /** @internal */
  _new(provider: ResolvedProvider): any {
    if (this._constructionCounter++ > this._strategy.getMaxNumberOfObjects()) {
      throw new CyclicDependencyError(this, provider.key);
    }
    return this._instantiateProvider(provider);
  }

  private _instantiateProvider(provider: ResolvedProvider): any {
    if (provider.multiProvider) {
      var res = ListWrapper.createFixedSize(provider.resolvedFactories.length);
      for (var i = 0; i < provider.resolvedFactories.length; ++i) {
        res[i] = this._instantiate(provider, provider.resolvedFactories[i]);
      }
      return res;
    } else {
      return this._instantiate(provider, provider.resolvedFactories[0]);
    }
  }

  private _instantiate(provider: ResolvedProvider, resolvedFactory: ResolvedFactory): any {
    var factory = resolvedFactory.factory;
    var deps = resolvedFactory.dependencies;
    var length = deps.length;

    var d0: any;
    var d1: any;
    var d2: any;
    var d3: any;
    var d4: any;
    var d5: any;
    var d6: any;
    var d7: any;
    var d8: any;
    var d9: any;
    var d10: any;
    var d11: any;
    var d12: any;
    var d13: any;
    var d14: any;
    var d15: any;
    var d16: any;
    var d17: any;
    var d18: any;
    var d19: any;
    try {
      d0 = length > 0 ? this._getByDependency(provider, deps[0]) : null;
      d1 = length > 1 ? this._getByDependency(provider, deps[1]) : null;
      d2 = length > 2 ? this._getByDependency(provider, deps[2]) : null;
      d3 = length > 3 ? this._getByDependency(provider, deps[3]) : null;
      d4 = length > 4 ? this._getByDependency(provider, deps[4]) : null;
      d5 = length > 5 ? this._getByDependency(provider, deps[5]) : null;
      d6 = length > 6 ? this._getByDependency(provider, deps[6]) : null;
      d7 = length > 7 ? this._getByDependency(provider, deps[7]) : null;
      d8 = length > 8 ? this._getByDependency(provider, deps[8]) : null;
      d9 = length > 9 ? this._getByDependency(provider, deps[9]) : null;
      d10 = length > 10 ? this._getByDependency(provider, deps[10]) : null;
      d11 = length > 11 ? this._getByDependency(provider, deps[11]) : null;
      d12 = length > 12 ? this._getByDependency(provider, deps[12]) : null;
      d13 = length > 13 ? this._getByDependency(provider, deps[13]) : null;
      d14 = length > 14 ? this._getByDependency(provider, deps[14]) : null;
      d15 = length > 15 ? this._getByDependency(provider, deps[15]) : null;
      d16 = length > 16 ? this._getByDependency(provider, deps[16]) : null;
      d17 = length > 17 ? this._getByDependency(provider, deps[17]) : null;
      d18 = length > 18 ? this._getByDependency(provider, deps[18]) : null;
      d19 = length > 19 ? this._getByDependency(provider, deps[19]) : null;
    } catch (e) {
      if (e instanceof AbstractProviderError || e instanceof InstantiationError) {
        e.addKey(this, provider.key);
      }
      throw e;
    }

    var obj;
    try {
      switch (length) {
        case 0:
          obj = factory();
          break;
        case 1:
          obj = factory(d0);
          break;
        case 2:
          obj = factory(d0, d1);
          break;
        case 3:
          obj = factory(d0, d1, d2);
          break;
        case 4:
          obj = factory(d0, d1, d2, d3);
          break;
        case 5:
          obj = factory(d0, d1, d2, d3, d4);
          break;
        case 6:
          obj = factory(d0, d1, d2, d3, d4, d5);
          break;
        case 7:
          obj = factory(d0, d1, d2, d3, d4, d5, d6);
          break;
        case 8:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7);
          break;
        case 9:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8);
          break;
        case 10:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9);
          break;
        case 11:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10);
          break;
        case 12:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11);
          break;
        case 13:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12);
          break;
        case 14:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13);
          break;
        case 15:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14);
          break;
        case 16:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15);
          break;
        case 17:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16);
          break;
        case 18:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16,
                        d17);
          break;
        case 19:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16,
                        d17, d18);
          break;
        case 20:
          obj = factory(d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14, d15, d16,
                        d17, d18, d19);
          break;
        default:
          throw new BaseException(
              `Cannot instantiate '${provider.key.displayName}' because it has more than 20 dependencies`);
      }
    } catch (e) {
      throw new InstantiationError(this, e, e.stack, provider.key);
    }
    return obj;
  }

  private _getByDependency(provider: ResolvedProvider, dep: Dependency): any {
    return this._getByKey(dep.key, dep.lowerBoundVisibility, dep.upperBoundVisibility,
                          dep.optional);
  }

  private _getByKey(key: Key, lowerBoundVisibility: Object, upperBoundVisibility: Object,
                    optional: boolean): any {
    if (key === INJECTOR_KEY) {
      return this;
    }

    if (upperBoundVisibility instanceof SelfMetadata) {
      return this._getByKeySelf(key, optional);

    } else {
      return this._getByKeyDefault(key, optional, lowerBoundVisibility);
    }
  }

  /** @internal */
  _throwOrNull(key: Key, optional: boolean): any {
    if (optional) {
      return null;
    } else {
      throw new NoProviderError(this, key);
    }
  }

  /** @internal */
  _getByKeySelf(key: Key, optional: boolean): any {
    var obj = this._strategy.getObjByKeyId(key.id);
    return (obj !== UNDEFINED) ? obj : this._throwOrNull(key, optional);
  }

  /** @internal */
  _getByKeyDefault(key: Key, optional: boolean, lowerBoundVisibility: Object): any {
    var inj: Injector;

    if (lowerBoundVisibility instanceof SkipSelfMetadata) {
      inj = this._parent;
    } else {
      inj = this;
    }

    while (inj instanceof Injector_) {
      var inj_ = <Injector_>inj;
      var obj = inj_._strategy.getObjByKeyId(key.id);
      if (obj !== UNDEFINED) return obj;
      inj = inj_._parent;
    }
    if (inj !== null) {
      if (optional) {
        return inj.getOptional(key.token);
      } else {
        return inj.get(key.token);
      }
    } else {
      return this._throwOrNull(key, optional);
    }
  }

  get displayName(): string {
    return `Injector(providers: [${_mapProviders(this, (b: ResolvedProvider) => ` "${b.key.displayName}" `).join(", ")}])`;
  }

  toString(): string { return this.displayName; }
}

var INJECTOR_KEY = Key.get(Injector);

function _mapProviders(injector: Injector_, fn: Function): any[] {
  var res = [];
  for (var i = 0; i < injector._proto.numberOfProviders; ++i) {
    res.push(fn(injector._proto.getProviderAtIndex(i)));
  }
  return res;
}
