import {
  describe,
  beforeEach,
  it,
  expect,
  ddescribe,
  iit,
  SpyObject,
  el,
  normalizeCSS
} from 'angular2/testing_internal';
import {ShadowCss, splitCurlyBlocks} from 'angular2/src/core/compiler/shadow_css';

import {RegExpWrapper, StringWrapper, isPresent} from 'angular2/src/core/facade/lang';

export function main() {
  describe('ShadowCss', function() {

    function s(css: string, contentAttr: string, hostAttr: string = '') {
      var shadowCss = new ShadowCss();
      var shim = shadowCss.shimCssText(css, contentAttr, hostAttr);
      var nlRegexp = /\n/g;
      return normalizeCSS(StringWrapper.replaceAll(shim, nlRegexp, ''));
    }

    it('should handle empty string', () => { expect(s('', 'a')).toEqual(''); });

    it('should add an attribute to every rule', () => {
      var css = 'one {color: red;}two {color: red;}';
      var expected = 'one[a] {color:red;}two[a] {color:red;}';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should handle invalid css', () => {
      var css = 'one {color: red;}garbage';
      var expected = 'one[a] {color:red;}garbage';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should add an attribute to every selector', () => {
      var css = 'one, two {color: red;}';
      var expected = 'one[a], two[a] {color:red;}';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should handle media rules', () => {
      var css = '@media screen and (max-width:800px) {div {font-size:50px;}}';
      var expected = '@media screen and (max-width:800px) {div[a] {font-size:50px;}}';
      expect(s(css, 'a')).toEqual(expected);
    });

    it('should handle media rules with simple rules', () => {
      var css = '@media screen and (max-width: 800px) {div {font-size: 50px;}} div {}';
      var expected = '@media screen and (max-width:800px) {div[a] {font-size:50px;}} div[a] {}';
      expect(s(css, 'a')).toEqual(expected);
    });

    // Check that the browser supports unprefixed CSS animation
    it('should handle keyframes rules', () => {
      var css = '@keyframes foo {0% {transform:translate(-50%) scaleX(0);}}';
      expect(s(css, 'a')).toEqual(css);
    });

    it('should handle -webkit-keyframes rules', () => {
      var css = '@-webkit-keyframes foo {0% {-webkit-transform:translate(-50%) scaleX(0);}}';
      expect(s(css, 'a')).toEqual(css);
    });

    it('should handle complicated selectors', () => {
      expect(s('one::before {}', 'a')).toEqual('one[a]::before {}');
      expect(s('one two {}', 'a')).toEqual('one[a] two[a] {}');
      expect(s('one > two {}', 'a')).toEqual('one[a] > two[a] {}');
      expect(s('one + two {}', 'a')).toEqual('one[a] + two[a] {}');
      expect(s('one ~ two {}', 'a')).toEqual('one[a] ~ two[a] {}');
      var res = s('.one.two > three {}', 'a');  // IE swap classes
      expect(res == '.one.two[a] > three[a] {}' || res == '.two.one[a] > three[a] {}')
          .toEqual(true);
      expect(s('one[attr="value"] {}', 'a')).toEqual('one[attr="value"][a] {}');
      expect(s('one[attr=value] {}', 'a')).toEqual('one[attr="value"][a] {}');
      expect(s('one[attr^="value"] {}', 'a')).toEqual('one[attr^="value"][a] {}');
      expect(s('one[attr$="value"] {}', 'a')).toEqual('one[attr$="value"][a] {}');
      expect(s('one[attr*="value"] {}', 'a')).toEqual('one[attr*="value"][a] {}');
      expect(s('one[attr|="value"] {}', 'a')).toEqual('one[attr|="value"][a] {}');
      expect(s('one[attr] {}', 'a')).toEqual('one[attr][a] {}');
      expect(s('[is="one"] {}', 'a')).toEqual('[is="one"][a] {}');
    });

    it('should handle :host', () => {
      expect(s(':host {}', 'a', 'a-host')).toEqual('[a-host] {}');
      expect(s(':host(.x,.y) {}', 'a', 'a-host')).toEqual('[a-host].x, [a-host].y {}');
      expect(s(':host(.x,.y) > .z {}', 'a', 'a-host'))
          .toEqual('[a-host].x > .z, [a-host].y > .z {}');
    });

    it('should handle :host-context', () => {
      expect(s(':host-context(.x) {}', 'a', 'a-host')).toEqual('[a-host].x, .x [a-host] {}');
      expect(s(':host-context(.x) > .y {}', 'a', 'a-host'))
          .toEqual('[a-host].x > .y, .x [a-host] > .y {}');
    });

    it('should support polyfill-next-selector', () => {
      var css = s("polyfill-next-selector {content: 'x > y'} z {}", 'a');
      expect(css).toEqual('x[a] > y[a]{}');

      css = s('polyfill-next-selector {content: "x > y"} z {}', 'a');
      expect(css).toEqual('x[a] > y[a]{}');
    });

    it('should support polyfill-unscoped-rule', () => {
      var css = s("polyfill-unscoped-rule {content: '#menu > .bar';color: blue;}", 'a');
      expect(StringWrapper.contains(css, '#menu > .bar {;color:blue;}')).toBeTruthy();

      css = s('polyfill-unscoped-rule {content: "#menu > .bar";color: blue;}', 'a');
      expect(StringWrapper.contains(css, '#menu > .bar {;color:blue;}')).toBeTruthy();
    });

    it('should support multiple instances polyfill-unscoped-rule', () => {
      var css = s("polyfill-unscoped-rule {content: 'foo';color: blue;}" +
                      "polyfill-unscoped-rule {content: 'bar';color: blue;}",
                  'a');
      expect(StringWrapper.contains(css, 'foo {;color:blue;}')).toBeTruthy();
      expect(StringWrapper.contains(css, 'bar {;color:blue;}')).toBeTruthy();
    });

    it('should support polyfill-rule', () => {
      var css = s("polyfill-rule {content: ':host.foo .bar';color: blue;}", 'a', 'a-host');
      expect(css).toEqual('[a-host].foo .bar {;color:blue;}');

      css = s('polyfill-rule {content: ":host.foo .bar";color:blue;}', 'a', 'a-host');
      expect(css).toEqual('[a-host].foo .bar {;color:blue;}');
    });

    it('should handle ::shadow', () => {
      var css = s('x::shadow > y {}', 'a');
      expect(css).toEqual('x[a] > y[a] {}');
    });

    it('should handle /deep/', () => {
      var css = s('x /deep/ y {}', 'a');
      expect(css).toEqual('x[a] y[a] {}');
    });

    it('should handle >>>', () => {
      var css = s('x >>> y {}', 'a');
      expect(css).toEqual('x[a] y[a] {}');
    });

    it('should pass through @import directives', () => {
      var styleStr = '@import url("https://fonts.googleapis.com/css?family=Roboto");';
      var css = s(styleStr, 'a');
      expect(css).toEqual(styleStr);
    });

    it('should shim rules after @import', () => {
      var styleStr = '@import url("a"); div {}';
      var css = s(styleStr, 'a');
      expect(css).toEqual('@import url("a"); div[a] {}');
    });

    it('should leave calc() unchanged', () => {
      var styleStr = 'div {height:calc(100% - 55px);}';
      var css = s(styleStr, 'a');
      expect(css).toEqual('div[a] {height:calc(100% - 55px);}');
    });
  });

  describe('splitCurlyBlocks', () => {
    it('should split empty css', () => { expect(splitCurlyBlocks('')).toEqual([]); });

    it('should split css rules without body',
       () => { expect(splitCurlyBlocks('a')).toEqual(['a', '']); });

    it('should split css rules with body',
       () => { expect(splitCurlyBlocks('a {b}')).toEqual(['a ', '{b}']); });

    it('should split css rules with nested rules', () => {
      expect(splitCurlyBlocks('a {b {c}} d {e}')).toEqual(['a ', '{b {c}}', ' d ', '{e}']);
    });
  });
}
