import {IMPLEMENTS, print} from 'angular2/src/facade/lang';
import {UrlResolver} from 'angular2/src/services/url_resolver';
import {
  isPresent,
  isBlank,
  RegExpWrapper,
  StringWrapper,
  BaseException
} from 'angular2/src/facade/lang';
import {DOM} from 'angular2/src/dom/dom_adapter';
import {Injectable} from 'angular2/di';
import {BrowserDomAdapter} from 'angular2/src/dom/browser_adapter';


export function commonDemoSetup(): void {
  BrowserDomAdapter.makeCurrent();
}

@Injectable()
export class DemoUrlResolver extends UrlResolver {
  constructor() {
    super(null);
  }

  resolve(baseUrl: string, url: string): string {
    // The standard UrlResolver looks for "package:" templateUrls in
    // node_modules, however in our repo we host material widgets at the root.
    if (url.startsWith('package:angular2_material/')) {
      return '/' + url.substring(8);
    }
    return super.resolve(baseUrl, url);
  }
}
