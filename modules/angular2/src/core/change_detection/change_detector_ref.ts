import {ChangeDetector} from './interfaces';
import {ChangeDetectionStrategy} from './constants';

/**
 * Reference to a component's change detection object.
 */
export class ChangeDetectorRef {
  /**
   * @internal
   */
  constructor(private _cd: ChangeDetector) {}

  /**
   * Marks all {@link OnPush} ancestors as to be checked.
   *
   * <!-- TODO: Add a link to a chapter on OnPush components -->
   *
   * ### Example ([live demo](http://plnkr.co/edit/GC512b?p=preview))
   *
   * ```typescript
   * @Component({selector: 'cmp', changeDetection: ChangeDetectionStrategy.OnPush})
   * @View({template: `Number of ticks: {{numberOfTicks}}`})
   * class Cmp {
   *   numberOfTicks = 0;
   *
   *   constructor(ref: ChangeDetectorRef) {
   *     setInterval(() => {
   *       this.numberOfTicks ++
   *       // the following is required, otherwise the view will not be updated
   *       this.ref.markForCheck();
   *     }, 1000);
   *   }
   * }
   *
   * @Component({
   *   selector: 'app',
   *   changeDetection: ChangeDetectionStrategy.OnPush
   * })
   * @View({
   *   template: `
   *     <cmp><cmp>
   *   `,
   *   directives: [Cmp]
   * })
   * class App {
   * }
   *
   * bootstrap(App);
   * ```
   */
  markForCheck(): void { this._cd.markPathToRootAsCheckOnce(); }

  /**
   * Detaches the change detector from the change detector tree.
   *
   * The detached change detector will not be checked until it is reattached.
   *
   * This can also be used in combination with {@link detectChanges} to implement local change
   * detection checks.
   *
   * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
   * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
   *
   * ### Example
   *
   * The following example defines a component with a large list of readonly data.
   * Imagine the data changes constantly, many times per second. For performance reasons,
   * we want to check and update the list every five seconds. We can do that by detaching
   * the component's change detector and doing a local check every five seconds.
   *
   * ```typescript
   * class DataProvider {
   *   // in a real application the returned data will be different every time
   *   get data() {
   *     return [1,2,3,4,5];
   *   }
   * }
   *
   * @Component({selector: 'giant-list'})
   * @View({
   *   template: `
   *     <li *ng-for="#d of dataProvider.data">Data {{d}}</lig>
   *   `,
   *   directives: [NgFor]
   * })
   * class GiantList {
   *   constructor(private ref: ChangeDetectorRef, private dataProvider:DataProvider) {
   *     ref.detach();
   *     setInterval(() => {
   *       this.ref.detectChanges();
   *     }, 5000);
   *   }
   * }
   *
   * @Component({
   *   selector: 'app', bindings: [DataProvider]
   * })
   * @View({
   *   template: `
   *     <giant-list><giant-list>
   *   `,
   *   directives: [GiantList]
   * })
   * class App {
   * }
   *
   * bootstrap(App);
   * ```
   */
  detach(): void { this._cd.mode = ChangeDetectionStrategy.Detached; }

  /**
   * Checks the change detector and its children.
   *
   * This can also be used in combination with {@link detach} to implement local change detection
   * checks.
   *
   * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
   * <!-- TODO: Add a live demo once ref.detectChanges is merged into master -->
   *
   * ### Example
   *
   * The following example defines a component with a large list of readonly data.
   * Imagine, the data changes constantly, many times per second. For performance reasons,
   * we want to check and update the list every five seconds.
   *
   * We can do that by detaching the component's change detector and doing a local change detection
   * check
   * every five seconds.
   *
   * See {@link detach} for more information.
   */
  detectChanges(): void { this._cd.detectChanges(); }

  /**
   * Reattach the change detector to the change detector tree.
   *
   * This also marks OnPush ancestors as to be checked. This reattached change detector will be
   * checked during the next change detection run.
   *
   * <!-- TODO: Add a link to a chapter on detach/reattach/local digest -->
   *
   * ### Example ([live demo](http://plnkr.co/edit/aUhZha?p=preview))
   *
   * The following example creates a component displaying `live` data. The component will detach
   * its change detector from the main change detector tree when the component's live property
   * is set to false.
   *
   * ```typescript
   * class DataProvider {
   *   data = 1;
   *
   *   constructor() {
   *     setInterval(() => {
   *       this.data = this.data * 2;
   *     }, 500);
   *   }
   * }
   *
   * @Component({selector: 'live-data', inputs: ['live']})
   * @View({
   *   template: `Data: {{dataProvider.data}}`
   * })
   * class LiveData {
   *   constructor(private ref: ChangeDetectorRef, private dataProvider:DataProvider) {}
   *
   *   set live(value) {
   *     if (value)
   *       this.ref.reattach();
   *     else
   *       this.ref.detach();
   *   }
   * }
   *
   * @Component({
   *   selector: 'app',
   *   bindings: [DataProvider]
   * })
   * @View({
   *   template: `
   *     Live Update: <input type="checkbox" [(ng-model)]="live">
   *     <live-data [live]="live"><live-data>
   *   `,
   *   directives: [LiveData, FORM_DIRECTIVES]
   * })
   * class App {
   *   live = true;
   * }
   *
   * bootstrap(App);
   * ```
   */
  reattach(): void {
    this._cd.mode = ChangeDetectionStrategy.CheckAlways;
    this.markForCheck();
  }
}
