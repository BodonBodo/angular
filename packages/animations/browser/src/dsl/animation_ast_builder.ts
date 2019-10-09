/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AUTO_STYLE, AnimateTimings, AnimationAnimateChildMetadata, AnimationAnimateMetadata, AnimationAnimateRefMetadata, AnimationGroupMetadata, AnimationKeyframesSequenceMetadata, AnimationMetadata, AnimationMetadataType, AnimationOptions, AnimationQueryMetadata, AnimationQueryOptions, AnimationReferenceMetadata, AnimationSequenceMetadata, AnimationStaggerMetadata, AnimationStateMetadata, AnimationStyleMetadata, AnimationTransitionMetadata, AnimationTriggerMetadata, style, ɵStyleData} from '@angular/animations';

import {AnimationDriver} from '../render/animation_driver';
import {getOrSetAsInMap} from '../render/shared';
import {ENTER_SELECTOR, LEAVE_SELECTOR, NG_ANIMATING_SELECTOR, NG_TRIGGER_SELECTOR, SUBSTITUTION_EXPR_START, copyObj, extractStyleParams, iteratorToArray, normalizeAnimationEntry, resolveTiming, validateStyleParams, visitDslNode} from '../util';

import {AnimateAst, AnimateChildAst, AnimateRefAst, Ast, DynamicTimingAst, GroupAst, KeyframesAst, QueryAst, ReferenceAst, SequenceAst, StaggerAst, StateAst, StyleAst, TimingAst, TransitionAst, TriggerAst} from './animation_ast';
import {AnimationDslVisitor} from './animation_dsl_visitor';
import {parseTransitionExpr} from './animation_transition_expr';

const SELF_TOKEN = ':self';
const SELF_TOKEN_REGEX = new RegExp(`\s*${SELF_TOKEN}\s*,?`, 'g');

/*
 * [Validation]
 * The visitor code below will traverse the animation AST generated by the animation verb functions
 * (the output is a tree of objects) and attempt to perform a series of validations on the data. The
 * following corner-cases will be validated:
 *
 * 1. Overlap of animations
 * Given that a CSS property cannot be animated in more than one place at the same time, it's
 * important that this behavior is detected and validated. The way in which this occurs is that
 * each time a style property is examined, a string-map containing the property will be updated with
 * the start and end times for when the property is used within an animation step.
 *
 * If there are two or more parallel animations that are currently running (these are invoked by the
 * group()) on the same element then the validator will throw an error. Since the start/end timing
 * values are collected for each property then if the current animation step is animating the same
 * property and its timing values fall anywhere into the window of time that the property is
 * currently being animated within then this is what causes an error.
 *
 * 2. Timing values
 * The validator will validate to see if a timing value of `duration delay easing` or
 * `durationNumber` is valid or not.
 *
 * (note that upon validation the code below will replace the timing data with an object containing
 * {duration,delay,easing}.
 *
 * 3. Offset Validation
 * Each of the style() calls are allowed to have an offset value when placed inside of keyframes().
 * Offsets within keyframes() are considered valid when:
 *
 *   - No offsets are used at all
 *   - Each style() entry contains an offset value
 *   - Each offset is between 0 and 1
 *   - Each offset is greater to or equal than the previous one
 *
 * Otherwise an error will be thrown.
 */
export function buildAnimationAst(
    driver: AnimationDriver, metadata: AnimationMetadata | AnimationMetadata[],
    errors: any[]): Ast<AnimationMetadataType> {
  return new AnimationAstBuilderVisitor(driver).build(metadata, errors);
}

const ROOT_SELECTOR = '';

export class AnimationAstBuilderVisitor implements AnimationDslVisitor {
  constructor(private _driver: AnimationDriver) {}

  build(metadata: AnimationMetadata|AnimationMetadata[], errors: any[]):
      Ast<AnimationMetadataType> {
    const context = new AnimationAstBuilderContext(errors);
    this._resetContextStyleTimingState(context);
    return <Ast<AnimationMetadataType>>visitDslNode(
        this, normalizeAnimationEntry(metadata), context);
  }

  private _resetContextStyleTimingState(context: AnimationAstBuilderContext) {
    context.currentQuerySelector = ROOT_SELECTOR;
    context.collectedStyles = {};
    context.collectedStyles[ROOT_SELECTOR] = {};
    context.currentTime = 0;
  }

  visitTrigger(metadata: AnimationTriggerMetadata, context: AnimationAstBuilderContext):
      TriggerAst {
    let queryCount = context.queryCount = 0;
    let depCount = context.depCount = 0;
    const states: StateAst[] = [];
    const transitions: TransitionAst[] = [];
    if (metadata.name.charAt(0) == '@') {
      context.errors.push(
          'animation triggers cannot be prefixed with an `@` sign (e.g. trigger(\'@foo\', [...]))');
    }

    metadata.definitions.forEach(def => {
      this._resetContextStyleTimingState(context);
      if (def.type == AnimationMetadataType.State) {
        const stateDef = def as AnimationStateMetadata;
        const name = stateDef.name;
        name.toString().split(/\s*,\s*/).forEach(n => {
          stateDef.name = n;
          states.push(this.visitState(stateDef, context));
        });
        stateDef.name = name;
      } else if (def.type == AnimationMetadataType.Transition) {
        const transition = this.visitTransition(def as AnimationTransitionMetadata, context);
        queryCount += transition.queryCount;
        depCount += transition.depCount;
        transitions.push(transition);
      } else {
        context.errors.push(
            'only state() and transition() definitions can sit inside of a trigger()');
      }
    });

    return {
      type: AnimationMetadataType.Trigger,
      name: metadata.name, states, transitions, queryCount, depCount,
      options: null
    };
  }

  visitState(metadata: AnimationStateMetadata, context: AnimationAstBuilderContext): StateAst {
    const styleAst = this.visitStyle(metadata.styles, context);
    const astParams = (metadata.options && metadata.options.params) || null;
    if (styleAst.containsDynamicStyles) {
      const missingSubs = new Set<string>();
      const params = astParams || {};
      styleAst.styles.forEach(value => {
        if (isObject(value)) {
          const stylesObj = value as any;
          Object.keys(stylesObj).forEach(prop => {
            extractStyleParams(stylesObj[prop]).forEach(sub => {
              if (!params.hasOwnProperty(sub)) {
                missingSubs.add(sub);
              }
            });
          });
        }
      });
      if (missingSubs.size) {
        const missingSubsArr = iteratorToArray(missingSubs.values());
        context.errors.push(
            `state("${metadata.name}", ...) must define default values for all the following style substitutions: ${missingSubsArr.join(', ')}`);
      }
    }

    return {
      type: AnimationMetadataType.State,
      name: metadata.name,
      style: styleAst,
      options: astParams ? {params: astParams} : null
    };
  }

  visitTransition(metadata: AnimationTransitionMetadata, context: AnimationAstBuilderContext):
      TransitionAst {
    context.queryCount = 0;
    context.depCount = 0;
    const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
    const matchers = parseTransitionExpr(metadata.expr, context.errors);

    return {
      type: AnimationMetadataType.Transition,
      matchers,
      animation,
      queryCount: context.queryCount,
      depCount: context.depCount,
      options: normalizeAnimationOptions(metadata.options)
    };
  }

  visitSequence(metadata: AnimationSequenceMetadata, context: AnimationAstBuilderContext):
      SequenceAst {
    return {
      type: AnimationMetadataType.Sequence,
      steps: metadata.steps.map(s => visitDslNode(this, s, context)),
      options: normalizeAnimationOptions(metadata.options)
    };
  }

  visitGroup(metadata: AnimationGroupMetadata, context: AnimationAstBuilderContext): GroupAst {
    const currentTime = context.currentTime;
    let furthestTime = 0;
    const steps = metadata.steps.map(step => {
      context.currentTime = currentTime;
      const innerAst = visitDslNode(this, step, context);
      furthestTime = Math.max(furthestTime, context.currentTime);
      return innerAst;
    });

    context.currentTime = furthestTime;
    return {
      type: AnimationMetadataType.Group,
      steps,
      options: normalizeAnimationOptions(metadata.options)
    };
  }

  visitAnimate(metadata: AnimationAnimateMetadata, context: AnimationAstBuilderContext):
      AnimateAst {
    const timingAst = constructTimingAst(metadata.timings, context.errors);
    context.currentAnimateTimings = timingAst;

    let styleAst: StyleAst|KeyframesAst;
    let styleMetadata: AnimationMetadata = metadata.styles ? metadata.styles : style({});
    if (styleMetadata.type == AnimationMetadataType.Keyframes) {
      styleAst = this.visitKeyframes(styleMetadata as AnimationKeyframesSequenceMetadata, context);
    } else {
      let styleMetadata = metadata.styles as AnimationStyleMetadata;
      let isEmpty = false;
      if (!styleMetadata) {
        isEmpty = true;
        const newStyleData: {[prop: string]: string | number} = {};
        if (timingAst.easing) {
          newStyleData['easing'] = timingAst.easing;
        }
        styleMetadata = style(newStyleData);
      }
      context.currentTime += timingAst.duration + timingAst.delay;
      const _styleAst = this.visitStyle(styleMetadata, context);
      _styleAst.isEmptyStep = isEmpty;
      styleAst = _styleAst;
    }

    context.currentAnimateTimings = null;
    return {
      type: AnimationMetadataType.Animate,
      timings: timingAst,
      style: styleAst,
      options: null
    };
  }

  visitStyle(metadata: AnimationStyleMetadata, context: AnimationAstBuilderContext): StyleAst {
    const ast = this._makeStyleAst(metadata, context);
    this._validateStyleAst(ast, context);
    return ast;
  }

  private _makeStyleAst(metadata: AnimationStyleMetadata, context: AnimationAstBuilderContext):
      StyleAst {
    const styles: (ɵStyleData | string)[] = [];
    if (Array.isArray(metadata.styles)) {
      (metadata.styles as(ɵStyleData | string)[]).forEach(styleTuple => {
        if (typeof styleTuple == 'string') {
          if (styleTuple == AUTO_STYLE) {
            styles.push(styleTuple);
          } else {
            context.errors.push(`The provided style string value ${styleTuple} is not allowed.`);
          }
        } else {
          styles.push(styleTuple);
        }
      });
    } else {
      styles.push(metadata.styles);
    }

    let containsDynamicStyles = false;
    let collectedEasing: string|null = null;
    styles.forEach(styleData => {
      if (isObject(styleData)) {
        const styleMap = styleData as ɵStyleData;
        const easing = styleMap['easing'];
        if (easing) {
          collectedEasing = easing as string;
          delete styleMap['easing'];
        }
        if (!containsDynamicStyles) {
          for (let prop in styleMap) {
            const value = styleMap[prop];
            if (value.toString().indexOf(SUBSTITUTION_EXPR_START) >= 0) {
              containsDynamicStyles = true;
              break;
            }
          }
        }
      }
    });

    return {
      type: AnimationMetadataType.Style,
      styles,
      easing: collectedEasing,
      offset: metadata.offset, containsDynamicStyles,
      options: null
    };
  }

  private _validateStyleAst(ast: StyleAst, context: AnimationAstBuilderContext): void {
    const timings = context.currentAnimateTimings;
    let endTime = context.currentTime;
    let startTime = context.currentTime;
    if (timings && startTime > 0) {
      startTime -= timings.duration + timings.delay;
    }

    ast.styles.forEach(tuple => {
      if (typeof tuple == 'string') return;

      Object.keys(tuple).forEach(prop => {
        if (!this._driver.validateStyleProperty(prop)) {
          context.errors.push(
              `The provided animation property "${prop}" is not a supported CSS property for animations`);
          return;
        }

        const collectedStyles = context.collectedStyles[context.currentQuerySelector !];
        const collectedEntry = collectedStyles[prop];
        let updateCollectedStyle = true;
        if (collectedEntry) {
          if (startTime != endTime && startTime >= collectedEntry.startTime &&
              endTime <= collectedEntry.endTime) {
            context.errors.push(
                `The CSS property "${prop}" that exists between the times of "${collectedEntry.startTime}ms" and "${collectedEntry.endTime}ms" is also being animated in a parallel animation between the times of "${startTime}ms" and "${endTime}ms"`);
            updateCollectedStyle = false;
          }

          // we always choose the smaller start time value since we
          // want to have a record of the entire animation window where
          // the style property is being animated in between
          startTime = collectedEntry.startTime;
        }

        if (updateCollectedStyle) {
          collectedStyles[prop] = {startTime, endTime};
        }

        if (context.options) {
          validateStyleParams(tuple[prop], context.options, context.errors);
        }
      });
    });
  }

  visitKeyframes(metadata: AnimationKeyframesSequenceMetadata, context: AnimationAstBuilderContext):
      KeyframesAst {
    const ast: KeyframesAst = {type: AnimationMetadataType.Keyframes, styles: [], options: null};
    if (!context.currentAnimateTimings) {
      context.errors.push(`keyframes() must be placed inside of a call to animate()`);
      return ast;
    }

    const MAX_KEYFRAME_OFFSET = 1;

    let totalKeyframesWithOffsets = 0;
    const offsets: number[] = [];
    let offsetsOutOfOrder = false;
    let keyframesOutOfRange = false;
    let previousOffset: number = 0;

    const keyframes: StyleAst[] = metadata.steps.map(styles => {
      const style = this._makeStyleAst(styles, context);
      let offsetVal: number|null =
          style.offset != null ? style.offset : consumeOffset(style.styles);
      let offset: number = 0;
      if (offsetVal != null) {
        totalKeyframesWithOffsets++;
        offset = style.offset = offsetVal;
      }
      keyframesOutOfRange = keyframesOutOfRange || offset < 0 || offset > 1;
      offsetsOutOfOrder = offsetsOutOfOrder || offset < previousOffset;
      previousOffset = offset;
      offsets.push(offset);
      return style;
    });

    if (keyframesOutOfRange) {
      context.errors.push(`Please ensure that all keyframe offsets are between 0 and 1`);
    }

    if (offsetsOutOfOrder) {
      context.errors.push(`Please ensure that all keyframe offsets are in order`);
    }

    const length = metadata.steps.length;
    let generatedOffset = 0;
    if (totalKeyframesWithOffsets > 0 && totalKeyframesWithOffsets < length) {
      context.errors.push(`Not all style() steps within the declared keyframes() contain offsets`);
    } else if (totalKeyframesWithOffsets == 0) {
      generatedOffset = MAX_KEYFRAME_OFFSET / (length - 1);
    }

    const limit = length - 1;
    const currentTime = context.currentTime;
    const currentAnimateTimings = context.currentAnimateTimings !;
    const animateDuration = currentAnimateTimings.duration;
    keyframes.forEach((kf, i) => {
      const offset = generatedOffset > 0 ? (i == limit ? 1 : (generatedOffset * i)) : offsets[i];
      const durationUpToThisFrame = offset * animateDuration;
      context.currentTime = currentTime + currentAnimateTimings.delay + durationUpToThisFrame;
      currentAnimateTimings.duration = durationUpToThisFrame;
      this._validateStyleAst(kf, context);
      kf.offset = offset;

      ast.styles.push(kf);
    });

    return ast;
  }

  visitReference(metadata: AnimationReferenceMetadata, context: AnimationAstBuilderContext):
      ReferenceAst {
    return {
      type: AnimationMetadataType.Reference,
      animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context),
      options: normalizeAnimationOptions(metadata.options)
    };
  }

  visitAnimateChild(metadata: AnimationAnimateChildMetadata, context: AnimationAstBuilderContext):
      AnimateChildAst {
    context.depCount++;
    return {
      type: AnimationMetadataType.AnimateChild,
      options: normalizeAnimationOptions(metadata.options)
    };
  }

  visitAnimateRef(metadata: AnimationAnimateRefMetadata, context: AnimationAstBuilderContext):
      AnimateRefAst {
    return {
      type: AnimationMetadataType.AnimateRef,
      animation: this.visitReference(metadata.animation, context),
      options: normalizeAnimationOptions(metadata.options)
    };
  }

  visitQuery(metadata: AnimationQueryMetadata, context: AnimationAstBuilderContext): QueryAst {
    const parentSelector = context.currentQuerySelector !;
    const options = (metadata.options || {}) as AnimationQueryOptions;

    context.queryCount++;
    context.currentQuery = metadata;
    const [selector, includeSelf] = normalizeSelector(metadata.selector);
    context.currentQuerySelector =
        parentSelector.length ? (parentSelector + ' ' + selector) : selector;
    getOrSetAsInMap(context.collectedStyles, context.currentQuerySelector, {});

    const animation = visitDslNode(this, normalizeAnimationEntry(metadata.animation), context);
    context.currentQuery = null;
    context.currentQuerySelector = parentSelector;

    return {
      type: AnimationMetadataType.Query,
      selector,
      limit: options.limit || 0,
      optional: !!options.optional, includeSelf, animation,
      originalSelector: metadata.selector,
      options: normalizeAnimationOptions(metadata.options)
    };
  }

  visitStagger(metadata: AnimationStaggerMetadata, context: AnimationAstBuilderContext):
      StaggerAst {
    if (!context.currentQuery) {
      context.errors.push(`stagger() can only be used inside of query()`);
    }
    const timings = metadata.timings === 'full' ?
        {duration: 0, delay: 0, easing: 'full'} :
        resolveTiming(metadata.timings, context.errors, true);

    return {
      type: AnimationMetadataType.Stagger,
      animation: visitDslNode(this, normalizeAnimationEntry(metadata.animation), context), timings,
      options: null
    };
  }
}

function normalizeSelector(selector: string): [string, boolean] {
  const hasAmpersand = selector.split(/\s*,\s*/).find(token => token == SELF_TOKEN) ? true : false;
  if (hasAmpersand) {
    selector = selector.replace(SELF_TOKEN_REGEX, '');
  }

  // the :enter and :leave selectors are filled in at runtime during timeline building
  selector = selector.replace(/@\*/g, NG_TRIGGER_SELECTOR)
                 .replace(/@\w+/g, match => NG_TRIGGER_SELECTOR + '-' + match.substr(1))
                 .replace(/:animating/g, NG_ANIMATING_SELECTOR);

  return [selector, hasAmpersand];
}


function normalizeParams(obj: {[key: string]: any} | any): {[key: string]: any}|null {
  return obj ? copyObj(obj) : null;
}

export type StyleTimeTuple = {
  startTime: number; endTime: number;
};

export class AnimationAstBuilderContext {
  public queryCount: number = 0;
  public depCount: number = 0;
  public currentTransition: AnimationTransitionMetadata|null = null;
  public currentQuery: AnimationQueryMetadata|null = null;
  public currentQuerySelector: string|null = null;
  public currentAnimateTimings: TimingAst|null = null;
  public currentTime: number = 0;
  public collectedStyles: {[selectorName: string]: {[propName: string]: StyleTimeTuple}} = {};
  public options: AnimationOptions|null = null;
  constructor(public errors: any[]) {}
}

function consumeOffset(styles: ɵStyleData | string | (ɵStyleData | string)[]): number|null {
  if (typeof styles == 'string') return null;

  let offset: number|null = null;

  if (Array.isArray(styles)) {
    styles.forEach(styleTuple => {
      if (isObject(styleTuple) && styleTuple.hasOwnProperty('offset')) {
        const obj = styleTuple as ɵStyleData;
        offset = parseFloat(obj['offset'] as string);
        delete obj['offset'];
      }
    });
  } else if (isObject(styles) && styles.hasOwnProperty('offset')) {
    const obj = styles;
    offset = parseFloat(obj['offset'] as string);
    delete obj['offset'];
  }
  return offset;
}

function isObject(value: any): boolean {
  return !Array.isArray(value) && typeof value == 'object';
}

function constructTimingAst(value: string | number | AnimateTimings, errors: any[]) {
  let timings: AnimateTimings|null = null;
  if (value.hasOwnProperty('duration')) {
    timings = value as AnimateTimings;
  } else if (typeof value == 'number') {
    const duration = resolveTiming(value, errors).duration;
    return makeTimingAst(duration, 0, '');
  }

  const strValue = value as string;
  const isDynamic = strValue.split(/\s+/).some(v => v.charAt(0) == '{' && v.charAt(1) == '{');
  if (isDynamic) {
    const ast = makeTimingAst(0, 0, '') as any;
    ast.dynamic = true;
    ast.strValue = strValue;
    return ast as DynamicTimingAst;
  }

  timings = timings || resolveTiming(strValue, errors);
  return makeTimingAst(timings.duration, timings.delay, timings.easing);
}

function normalizeAnimationOptions(options: AnimationOptions | null): AnimationOptions {
  if (options) {
    options = copyObj(options);
    if (options['params']) {
      options['params'] = normalizeParams(options['params']) !;
    }
  } else {
    options = {};
  }
  return options;
}

function makeTimingAst(duration: number, delay: number, easing: string | null): TimingAst {
  return {duration, delay, easing};
}
