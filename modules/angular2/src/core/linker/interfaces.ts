import {MapWrapper} from 'angular2/src/facade/collection';
import {SimpleChange} from 'angular2/src/core/change_detection/change_detection_util';

export enum LifecycleHooks {
  OnInit,
  OnDestroy,
  DoCheck,
  OnChanges,
  AfterContentInit,
  AfterContentChecked,
  AfterViewInit,
  AfterViewChecked
}

/**
 * @internal
 */
export var LIFECYCLE_HOOKS_VALUES = [
  LifecycleHooks.OnInit,
  LifecycleHooks.OnDestroy,
  LifecycleHooks.DoCheck,
  LifecycleHooks.OnChanges,
  LifecycleHooks.AfterContentInit,
  LifecycleHooks.AfterContentChecked,
  LifecycleHooks.AfterViewInit,
  LifecycleHooks.AfterViewChecked
];

/**
 * Lifecycle hooks are guaranteed to be called in the following order:
 * - `OnChanges` (if any bindings have changed),
 * - `OnInit` (after the first check only),
 * - `DoCheck`,
 * - `AfterContentInit`,
 * - `AfterContentChecked`,
 * - `AfterViewInit`,
 * - `AfterViewChecked`,
 * - `OnDestroy` (at the very end before destruction)
 */

/**
 * Implement this interface to get notified when any data-bound property of your directive changes.
 *
 * `ngOnChanges` is called right after the data-bound properties have been checked and before view
 * and content children are checked if at least one of them has changed.
 *
 * The `changes` parameter contains an entry for each of the changed data-bound property. The key is
 * the property name and the value is an instance of {@link SimpleChange}.
 *
 * ### Example ([live example](http://plnkr.co/edit/AHrB6opLqHDBPkt4KpdT?p=preview)):
 *
 * ```typescript
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<p>myProp = {{myProp}}</p>`
 * })
 * class MyComponent implements OnChanges {
 *   @Input() myProp: any;
 *
 *   ngOnChanges(changes: {[propName: string]: SimpleChange}) {
 *     console.log('ngOnChanges - myProp = ' + changes['myProp'].currentValue);
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <button (click)="value = value + 1">Change MyComponent</button>
 *     <my-cmp [my-prop]="value"></my-cmp>`,
 *   directives: [MyComponent]
 * })
 * export class App {
 *   value = 0;
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 */
export interface OnChanges { ngOnChanges(changes: {[key: string]: SimpleChange}); }

/**
 * Implement this interface to execute custom initialization logic after your directive's
 * data-bound properties have been initialized.
 *
 * `ngOnInit` is called right after the directive's data-bound properties have been checked for the
 * first time, and before any of its children have been checked. It is invoked only once when the
 * directive is instantiated.
 *
 * ### Example ([live example](http://plnkr.co/edit/1MBypRryXd64v4pV03Yn?p=preview))
 *
 * ```typescript
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<p>my-component</p>`
 * })
 * class MyComponent implements OnInit, OnDestroy {
 *   ngOnInit() {
 *     console.log('ngOnInit');
 *   }
 *
 *   ngOnDestroy() {
 *     console.log('ngOnDestroy');
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <button (click)="hasChild = !hasChild">
 *       {{hasChild ? 'Destroy' : 'Create'}} MyComponent
 *     </button>
 *     <my-cmp *ng-if="hasChild"></my-cmp>`,
 *   directives: [MyComponent, NgIf]
 * })
 * export class App {
 *   hasChild = true;
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 *  ```
 */
export interface OnInit { ngOnInit(); }

/**
 * Implement this interface to override the default change detection algorithm for your directive.
 *
 * `ngDoCheck` gets called to check the changes in the directives instead of the default algorithm.
 *
 * The default change detection algorithm looks for differences by comparing bound-property values
 * by reference across change detection runs. When `DoCheck` is implemented, the default algorithm
 * is disabled and `ngDoCheck` is responsible for checking for changes.
 *
 * Implementing this interface allows improving performance by using insights about the component,
 * its implementation and data types of its properties.
 *
 * Note that a directive should not implement both `DoCheck` and {@link OnChanges} at the same time.
 * `ngOnChanges` would not be called when a directive implements `DoCheck`. Reaction to the changes
 * have to be handled from within the `ngDoCheck` callback.
 *
 * Use {@link KeyValueDiffers} and {@link IterableDiffers} to add your custom check mechanisms.
 *
 * ### Example ([live demo](http://plnkr.co/edit/QpnIlF0CR2i5bcYbHEUJ?p=preview))
 *
 * In the following example `ngDoCheck` uses an {@link IterableDiffers} to detect the updates to the
 * array `list`:
 *
 * ```typescript
 * @Component({
 *   selector: 'custom-check',
 *   template: `
 *     <p>Changes:</p>
 *     <ul>
 *       <li *ng-for="#line of logs">{{line}}</li>
 *     </ul>`,
 *   directives: [NgFor]
 * })
 * class CustomCheckComponent implements DoCheck {
 *   @Input() list: any[];
 *   differ: any;
 *   logs = [];
 *
 *   constructor(differs: IterableDiffers) {
 *     this.differ = differs.find([]).create(null);
 *   }
 *
 *   ngDoCheck() {
 *     var changes = this.differ.diff(this.list);
 *
 *     if (changes) {
 *       changes.forEachAddedItem(r => this.logs.push('added ' + r.item));
 *       changes.forEachRemovedItem(r => this.logs.push('removed ' + r.item))
 *     }
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <button (click)="list.push(list.length)">Push</button>
 *     <button (click)="list.pop()">Pop</button>
 *     <custom-check [list]="list"></custom-check>`,
 *   directives: [CustomCheckComponent]
 * })
 * export class App {
 *   list = [];
 * }
 * ```
 */
export interface DoCheck { ngDoCheck(); }

/**
 * Implement this interface to get notified when your directive is destroyed.
 *
 * `ngOnDestroy` callback is typically used for any custom cleanup that needs to occur when the
 * instance is destroyed
 *
 * ### Example ([live example](http://plnkr.co/edit/1MBypRryXd64v4pV03Yn?p=preview))
 *
 * ```typesript
 * @Component({
 *   selector: 'my-cmp',
 *   template: `<p>my-component</p>`
 * })
 * class MyComponent implements OnInit, OnDestroy {
 *   ngOnInit() {
 *     console.log('ngOnInit');
 *   }
 *
 *   ngOnDestroy() {
 *     console.log('ngOnDestroy');
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <button (click)="hasChild = !hasChild">
 *       {{hasChild ? 'Destroy' : 'Create'}} MyComponent
 *     </button>
 *     <my-cmp *ng-if="hasChild"></my-cmp>`,
 *   directives: [MyComponent, NgIf]
 * })
 * export class App {
 *   hasChild = true;
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 */
export interface OnDestroy { ngOnDestroy(); }

/**
 * Implement this interface to get notified when your directive's content has been fully
 * initialized.
 *
 * ### Example ([live demo](http://plnkr.co/edit/plamXUpsLQbIXpViZhUO?p=preview))
 *
 * ```typescript
 * @Component({
 *   selector: 'child-cmp',
 *   template: `{{where}} child`
 * })
 * class ChildComponent {
 *   @Input() where: string;
 * }
 *
 * @Component({
 *   selector: 'parent-cmp',
 *   template: `<ng-content></ng-content>`
 * })
 * class ParentComponent implements AfterContentInit {
 *   @ContentChild(ChildComponent) contentChild: ChildComponent;
 *
 *   constructor() {
 *     // contentChild is not initialized yet
 *     console.log(this.getMessage(this.contentChild));
 *   }
 *
 *   ngAfterContentInit() {
 *     // contentChild is updated after the content has been checked
 *     console.log('AfterContentInit: ' + this.getMessage(this.contentChild));
 *   }
 *
 *   private getMessage(cmp: ChildComponent): string {
 *     return cmp ? cmp.where + ' child' : 'no child';
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <parent-cmp>
 *       <child-cmp where="content"></child-cmp>
 *     </parent-cmp>`,
 *   directives: [ParentComponent, ChildComponent]
 * })
 * export class App {
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 */
export interface AfterContentInit { ngAfterContentInit(); }

/**
 * Implement this interface to get notified after every check of your directive's content.
 *
 * ### Example ([live demo](http://plnkr.co/edit/tGdrytNEKQnecIPkD7NU?p=preview))
 *
 * ```typescript
 * @Component({selector: 'child-cmp', template: `{{where}} child`})
 * class ChildComponent {
 *   @Input() where: string;
 * }
 *
 * @Component({selector: 'parent-cmp', template: `<ng-content></ng-content>`})
 * class ParentComponent implements AfterContentChecked {
 *   @ContentChild(ChildComponent) contentChild: ChildComponent;
 *
 *   constructor() {
 *     // contentChild is not initialized yet
 *     console.log(this.getMessage(this.contentChild));
 *   }
 *
 *   ngAfterContentChecked() {
 *     // contentChild is updated after the content has been checked
 *     console.log('AfterContentChecked: ' + this.getMessage(this.contentChild));
 *   }
 *
 *   private getMessage(cmp: ChildComponent): string {
 *     return cmp ? cmp.where + ' child' : 'no child';
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `
 *     <parent-cmp>
 *       <button (click)="hasContent = !hasContent">Toggle content child</button>
 *       <child-cmp *ng-if="hasContent" where="content"></child-cmp>
 *     </parent-cmp>`,
 *   directives: [NgIf, ParentComponent, ChildComponent]
 * })
 * export class App {
 *   hasContent = true;
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 */
export interface AfterContentChecked { ngAfterContentChecked(); }

/**
 * Implement this interface to get notified when your component's view has been fully initialized.
 *
 * ### Example ([live demo](http://plnkr.co/edit/LhTKVMEM0fkJgyp4CI1W?p=preview))
 *
 * ```typescript
 * @Component({selector: 'child-cmp', template: `{{where}} child`})
 * class ChildComponent {
 *   @Input() where: string;
 * }
 *
 * @Component({
 *   selector: 'parent-cmp',
 *   template: `<child-cmp where="view"></child-cmp>`,
 *   directives: [ChildComponent]
 * })
 * class ParentComponent implements AfterViewInit {
 *   @ViewChild(ChildComponent) viewChild: ChildComponent;
 *
 *   constructor() {
 *     // viewChild is not initialized yet
 *     console.log(this.getMessage(this.viewChild));
 *   }
 *
 *   ngAfterViewInit() {
 *     // viewChild is updated after the view has been initialized
 *     console.log('ngAfterViewInit: ' + this.getMessage(this.viewChild));
 *   }
 *
 *   private getMessage(cmp: ChildComponent): string {
 *     return cmp ? cmp.where + ' child' : 'no child';
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `<parent-cmp></parent-cmp>`,
 *   directives: [ParentComponent]
 * })
 * export class App {
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 */
export interface AfterViewInit { ngAfterViewInit(); }

/**
 * Implement this interface to get notified after every check of your component's view.
 *
 * ### Example ([live demo](http://plnkr.co/edit/0qDGHcPQkc25CXhTNzKU?p=preview))
 *
 * ```typescript
 * @Component({selector: 'child-cmp', template: `{{where}} child`})
 * class ChildComponent {
 *   @Input() where: string;
 * }
 *
 * @Component({
 *   selector: 'parent-cmp',
 *   template: `
 *     <button (click)="showView = !showView">Toggle view child</button>
 *     <child-cmp *ng-if="showView" where="view"></child-cmp>`,
 *   directives: [NgIf, ChildComponent]
 * })
 * class ParentComponent implements AfterViewChecked {
 *   @ViewChild(ChildComponent) viewChild: ChildComponent;
 *   showView = true;
 *
 *   constructor() {
 *     // viewChild is not initialized yet
 *     console.log(this.getMessage(this.viewChild));
 *   }
 *
 *   ngAfterViewChecked() {
 *     // viewChild is updated after the view has been checked
 *     console.log('AfterViewChecked: ' + this.getMessage(this.viewChild));
 *   }
 *
 *   private getMessage(cmp: ChildComponent): string {
 *     return cmp ? cmp.where + ' child' : 'no child';
 *   }
 * }
 *
 * @Component({
 *   selector: 'app',
 *   template: `<parent-cmp></parent-cmp>`,
 *   directives: [ParentComponent]
 * })
 * export class App {
 * }
 *
 * bootstrap(App).catch(err => console.error(err));
 * ```
 */
export interface AfterViewChecked { ngAfterViewChecked(); }
