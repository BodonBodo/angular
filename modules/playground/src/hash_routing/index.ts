import {Component, provide} from 'angular2/core';
import {bootstrap} from 'angular2/platform/browser';
import {
  RouteConfig,
  Route,
  ROUTER_PROVIDERS,
  ROUTER_DIRECTIVES,
  HashLocationStrategy,
  LocationStrategy
} from 'angular2/router';


@Component({selector: 'hello-cmp', template: `hello`})
class HelloCmp {
}


@Component({selector: 'goodbye-cmp', template: `goodbye`})
class GoodByeCmp {
}


@Component({
  selector: 'example-app',
  template: `
    <h1>My App</h1>
    <nav>
      <a href="#/" id="hello-link">Navigate via href</a> |
      <a [routerLink]="['/GoodbyeCmp']" id="goodbye-link">Navigate with Link DSL</a>
      <a [routerLink]="['/GoodbyeCmp']" id="goodbye-link-blank" target="_blank">
        Navigate with Link DSL _blank target
      </a>
    </nav>
    <router-outlet></router-outlet>
  `,
  directives: [ROUTER_DIRECTIVES]
})
@RouteConfig([
  new Route({path: '/', component: HelloCmp, name: 'HelloCmp'}),
  new Route({path: '/bye', component: GoodByeCmp, name: 'GoodbyeCmp'})
])
class AppCmp {
}


export function main() {
  bootstrap(AppCmp,
            [ROUTER_PROVIDERS, provide(LocationStrategy, {useClass: HashLocationStrategy})]);
}
