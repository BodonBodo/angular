/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AfterViewInit, Directive, EventEmitter, Inject, Input, Optional, Self, forwardRef} from '@angular/core';

import {AbstractControl, FormControl, FormGroup, FormHooks} from '../model';
import {NG_ASYNC_VALIDATORS, NG_VALIDATORS} from '../validators';

import {ControlContainer} from './control_container';
import {Form} from './form_interface';
import {NgControl} from './ng_control';
import {NgModel} from './ng_model';
import {NgModelGroup} from './ng_model_group';
import {composeAsyncValidators, composeValidators, removeDir, setUpControl, setUpFormContainer, syncPendingControls} from './shared';

export const formDirectiveProvider: any = {
  provide: ControlContainer,
  useExisting: forwardRef(() => NgForm)
};

const resolvedPromise = (() => Promise.resolve(null))();

/**
 * @description
 * Creates a top-level `FormGroup` instance and binds it to a form
 * to track aggregate form value and validation status.
 *
 * As soon as you import the `FormsModule`, this directive becomes active by default on
 * all `<form>` tags.  You don't need to add a special selector.
 *
 * You optionally export the directive into a local template variable using `ngForm` as the key
 * (ex: `#myForm="ngForm"`). This is optional, but useful.  Many properties from the underlying
 * `FormGroup` instance are duplicated on the directive itself, so a reference to it
 * gives you access to the aggregate value and validity status of the form, as well as
 * user interaction properties like `dirty` and `touched`.
 *
 * To register child controls with the form, use `NgModel` with a `name`
 * attribute. You may use `NgModelGroup` to create sub-groups within the form.
 *
 * If necessary, listen to the directive's `ngSubmit` event to be notified when the user has
 * triggered a form submission. The `ngSubmit` event emits the original form
 * submission event.
 *
 * In template driven forms, all `<form>` tags are automatically tagged as `NgForm`.
 * To import the `FormsModule` but skip its usage in some forms,
 * for example, to use native HTML5 validation, add the `ngNoForm` and the `<form>`
 * tags won't create an `NgForm` directive. In reactive forms, using `ngNoForm` is
 * unnecessary because the `<form>` tags are inert. In that case, you would
 * refrain from using the `formGroup` directive.
 *
 * @usageNotes
 *
 * ### Migrating from deprecated ngForm selector
 *
 * Support for using `ngForm` element selector has been deprecated in Angular v6 and will be removed
 * in Angular v9.
 *
 * This has been deprecated to keep selectors consistent with other core Angular selectors,
 * as element selectors are typically written in kebab-case.
 *
 * Now deprecated:
 * ```html
 * <ngForm #myForm="ngForm">
 * ```
 *
 * After:
 * ```html
 * <ng-form #myForm="ngForm">
 * ```
 *
 * ### Listening for form submission
 *
 * The following example shows how to capture the form values from the "ngSubmit" event.
 *
 * {@example forms/ts/simpleForm/simple_form_example.ts region='Component'}
 *
 * ### Setting the update options
 *
 * The following example shows you how to change the "updateOn" option from its default using
 * ngFormOptions.
 *
 * ```html
 * <form [ngFormOptions]="{updateOn: 'blur'}">
 *    <input name="one" ngModel>  <!-- this ngModel will update on blur -->
 * </form>
 * ```
 *
 * @ngModule FormsModule
 * @publicApi
 */
@Directive({
  selector: 'form:not([ngNoForm]):not([formGroup]),ngForm,ng-form,[ngForm]',
  providers: [formDirectiveProvider],
  host: {'(submit)': 'onSubmit($event)', '(reset)': 'onReset()'},
  outputs: ['ngSubmit'],
  exportAs: 'ngForm'
})
export class NgForm extends ControlContainer implements Form,
    AfterViewInit {
  /**
   * @description
   * Returns whether the form submission has been triggered.
   */
  public readonly submitted: boolean = false;

  private _directives: NgModel[] = [];

  /**
   * @description
   * The `FormGroup` instance created for this form.
   */
  form: FormGroup;

  /**
   * @description
   * Event emitter for the "ngSubmit" event
   */
  ngSubmit = new EventEmitter();

  /**
   * @description
   * Tracks options for the `NgForm` instance.
   *
   * **updateOn**: Sets the default `updateOn` value for all child `NgModels` below it
   * unless explicitly set by a child `NgModel` using `ngModelOptions`). Defaults to 'change'.
   * Possible values: `'change'` | `'blur'` | `'submit'`.
   *
   */
  // TODO(issue/24571): remove '!'.
  @Input('ngFormOptions') options !: {updateOn?: FormHooks};

  constructor(
      @Optional() @Self() @Inject(NG_VALIDATORS) validators: any[],
      @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: any[]) {
    super();
    this.form =
        new FormGroup({}, composeValidators(validators), composeAsyncValidators(asyncValidators));
  }

  /**
   * @description
   * Lifecycle method called after the view is initialized. For internal use only.
   */
  ngAfterViewInit() { this._setUpdateStrategy(); }

  /**
   * @description
   * The directive instance.
   */
  get formDirective(): Form { return this; }

  /**
   * @description
   * The internal `FormGroup` instance.
   */
  get control(): FormGroup { return this.form; }

  /**
   * @description
   * Returns an array representing the path to this group. Because this directive
   * always lives at the top level of a form, it is always an empty array.
   */
  get path(): string[] { return []; }

  /**
   * @description
   * Returns a map of the controls in this group.
   */
  get controls(): {[key: string]: AbstractControl} { return this.form.controls; }

  /**
   * @description
   * Method that sets up the control directive in this group, re-calculates its value
   * and validity, and adds the instance to the internal list of directives.
   *
   * @param dir The `NgModel` directive instance.
   */
  addControl(dir: NgModel): void {
    resolvedPromise.then(() => {
      const container = this._findContainer(dir.path);
      (dir as{control: FormControl}).control =
          <FormControl>container.registerControl(dir.name, dir.control);
      setUpControl(dir.control, dir);
      dir.control.updateValueAndValidity({emitEvent: false});
      this._directives.push(dir);
    });
  }

  /**
   * @description
   * Retrieves the `FormControl` instance from the provided `NgModel` directive.
   *
   * @param dir The `NgModel` directive instance.
   */
  getControl(dir: NgModel): FormControl { return <FormControl>this.form.get(dir.path); }

  /**
   * @description
   * Removes the `NgModel` instance from the internal list of directives
   *
   * @param dir The `NgModel` directive instance.
   */
  removeControl(dir: NgModel): void {
    resolvedPromise.then(() => {
      const container = this._findContainer(dir.path);
      if (container) {
        container.removeControl(dir.name);
      }
      removeDir<NgModel>(this._directives, dir);
    });
  }

  /**
   * @description
   * Adds a new `NgModelGroup` directive instance to the form.
   *
   * @param dir The `NgModelGroup` directive instance.
   */
  addFormGroup(dir: NgModelGroup): void {
    resolvedPromise.then(() => {
      const container = this._findContainer(dir.path);
      const group = new FormGroup({});
      setUpFormContainer(group, dir);
      container.registerControl(dir.name, group);
      group.updateValueAndValidity({emitEvent: false});
    });
  }

  /**
   * @description
   * Removes the `NgModelGroup` directive instance from the form.
   *
   * @param dir The `NgModelGroup` directive instance.
   */
  removeFormGroup(dir: NgModelGroup): void {
    resolvedPromise.then(() => {
      const container = this._findContainer(dir.path);
      if (container) {
        container.removeControl(dir.name);
      }
    });
  }

  /**
   * @description
   * Retrieves the `FormGroup` for a provided `NgModelGroup` directive instance
   *
   * @param dir The `NgModelGroup` directive instance.
   */
  getFormGroup(dir: NgModelGroup): FormGroup { return <FormGroup>this.form.get(dir.path); }

  /**
   * Sets the new value for the provided `NgControl` directive.
   *
   * @param dir The `NgControl` directive instance.
   * @param value The new value for the directive's control.
   */
  updateModel(dir: NgControl, value: any): void {
    resolvedPromise.then(() => {
      const ctrl = <FormControl>this.form.get(dir.path !);
      ctrl.setValue(value);
    });
  }

  /**
   * @description
   * Sets the value for this `FormGroup`.
   *
   * @param value The new value
   */
  setValue(value: {[key: string]: any}): void { this.control.setValue(value); }

  /**
   * @description
   * Method called when the "submit" event is triggered on the form.
   * Triggers the `ngSubmit` emitter to emit the "submit" event as its payload.
   *
   * @param $event The "submit" event object
   */
  onSubmit($event: Event): boolean {
    (this as{submitted: boolean}).submitted = true;
    syncPendingControls(this.form, this._directives);
    this.ngSubmit.emit($event);
    return false;
  }

  /**
   * @description
   * Method called when the "reset" event is triggered on the form.
   */
  onReset(): void { this.resetForm(); }

  /**
   * @description
   * Resets the form to an initial value and resets its submitted status.
   *
   * @param value The new value for the form.
   */
  resetForm(value: any = undefined): void {
    this.form.reset(value);
    (this as{submitted: boolean}).submitted = false;
  }

  private _setUpdateStrategy() {
    if (this.options && this.options.updateOn != null) {
      this.form._updateOn = this.options.updateOn;
    }
  }

  /** @internal */
  _findContainer(path: string[]): FormGroup {
    path.pop();
    return path.length ? <FormGroup>this.form.get(path) : this.form;
  }
}
