FooComponent.ɵfac…
FooComponent.ɵcmp…

BarDirective.ɵfac…
BarDirective.ɵdir…

QuxPipe.ɵfac…
QuxPipe.ɵpipe…

FooModule.ɵfac = function FooModule_Factory(t) { return new (t || FooModule)(); };
FooModule.ɵmod = /*@__PURE__*/ $i0$.ɵɵdefineNgModule({type: FooModule, bootstrap: [FooComponent], declarations: [FooComponent, BarDirective, QuxPipe]});
FooModule.ɵinj = /*@__PURE__*/ $i0$.ɵɵdefineInjector({});
…
(function () { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(FooModule, [{
  type: NgModule,
  args: [{ declarations: [FooComponent, BarDirective, QuxPipe], bootstrap: [FooComponent] }]
}], null, null); })();
