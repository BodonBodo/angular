import {int, isPresent} from 'angular2/src/facade/lang';
import {reflector} from 'angular2/src/reflection/reflection';
import {getIntParameter, bindAction} from 'angular2/src/test_lib/benchmark_util';
import {bootstrap, Component, Viewport, Template, ViewContainer, Compiler}
    from 'angular2/angular2';
import {PromiseWrapper} from 'angular2/src/facade/async';
import {ListWrapper} from 'angular2/src/facade/collection';
import {ScrollAreaComponent} from './scroll_area';
import {If, Foreach} from 'angular2/directives';
import {DOM, document, Element} from 'angular2/src/facade/dom';

export class App {
  scrollAreas:List<int>;
  iterationCount:int;
  scrollIncrement:int;

  constructor() {
    var appSize = getIntParameter('appSize');
    this.iterationCount = getIntParameter('iterationCount');
    this.scrollIncrement = getIntParameter('scrollIncrement');
    appSize = appSize > 1 ? appSize - 1 : 0;  // draw at least one table
    this.scrollAreas = [];
    for (var i = 0; i < appSize; i++) {
      ListWrapper.push(this.scrollAreas, i);
    }
    // TODO(tbosch): change to bindAction when it works in pub serve
    DOM.on(DOM.query('scroll-app /deep/ #run-btn'), 'click', (_) => {
      this.runBenchmark();
    });
    DOM.on(DOM.query('scroll-app /deep/ #reset-btn'), 'click', (_) => {
      this._getScrollDiv().scrollTop = 0;
      var existingMarker = this._locateFinishedMarker();
      if (isPresent(existingMarker)) {
        DOM.removeChild(document.body, existingMarker);
      }
    });
  }

  runBenchmark() {
    var scrollDiv = this._getScrollDiv();
    var n:int = this.iterationCount;
    var scheduleScroll;
    scheduleScroll = () => {
      PromiseWrapper.setTimeout(() => {
        scrollDiv.scrollTop += this.scrollIncrement;
        n--;
        if (n > 0) {
          scheduleScroll();
        } else {
          this._scheduleFinishedMarker();
        }
      }, 0);
    }
    scheduleScroll();
  }

  // Puts a marker indicating that the test is finished.
  _scheduleFinishedMarker() {
    var existingMarker = this._locateFinishedMarker();
    if (isPresent(existingMarker)) {
      // Nothing to do, the marker is already there
      return;
    }
    PromiseWrapper.setTimeout(() => {
      var finishedDiv = DOM.createElement('div');
      finishedDiv.id = 'done';
      DOM.setInnerHTML(finishedDiv, 'Finished');
      DOM.appendChild(document.body, finishedDiv);
    }, 0);
  }

  _locateFinishedMarker():Element {
    return DOM.querySelector(document.body, '#done');
  }

  _getScrollDiv() {
    return DOM.query('body /deep/ #testArea /deep/ #scrollDiv');
  }
}

export function setupReflectorForApp() {
  reflector.registerType(App, {
    'factory': () => { return new App(); },
    'parameters': [],
    'annotations': [
      new Component({selector: 'scroll-app'}),
      new Template({
        directives: [ScrollAreaComponent, If, Foreach],
        inline: `
          <div>
            <div style="display: flex">
              <scroll-area id="testArea"></scroll-area>
              <div style="padding-left: 20px">
                <button id="run-btn">Run</button>
                <button id="reset-btn">Reset</button>
              </div>
            </div>
            <div template="if scrollAreas.length > 0">
              <p>Following tables are only here to add weight to the UI:</p>
              <scroll-area template="foreach #scrollArea in scrollAreas"></scroll-area>
            </div>
          </div>`
      })]
  });
}
