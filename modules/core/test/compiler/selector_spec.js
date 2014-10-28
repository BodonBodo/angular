import {describe, it, expect, beforeEach, ddescribe, iit} from 'test_lib/test_lib';
import {SelectorMatcher, CssSelector, Attr} from 'core/compiler/selector';
import {List, ListWrapper, MapWrapper} from 'facade/collection';
import {isPresent} from 'facade/lang';

export function main() {
  describe('SelectorMatcher', () => {
    var matcher, matched, selectableCollector;

    function reset() {
      matched = ListWrapper.create();
    }

    beforeEach(() => {
      reset();
      selectableCollector = (selectable) => {
        ListWrapper.push(matched, selectable);
      }
      matcher = new SelectorMatcher();
    });

    it('should select by element name case insensitive', () => {
      matcher.addSelectable(CssSelector.parse('someTag'), 1);

      matcher.match(CssSelector.parse('SOMEOTHERTAG'), selectableCollector);
      expect(matched).toEqual([]);

      matcher.match(CssSelector.parse('SOMETAG'), selectableCollector);
      expect(matched).toEqual([1]);
    });

    it('should select by class name case insensitive', () => {
      matcher.addSelectable(CssSelector.parse('.someClass'), 1);
      matcher.addSelectable(CssSelector.parse('.someClass.class2'), 2);

      matcher.match(CssSelector.parse('.SOMEOTHERCLASS'), selectableCollector);
      expect(matched).toEqual([]);

      matcher.match(CssSelector.parse('.SOMECLASS'), selectableCollector);
      expect(matched).toEqual([1]);

      reset();
      matcher.match(CssSelector.parse('.someClass.class2'), selectableCollector);
      expect(matched).toEqual([1,2]);
    });

    it('should select by attr name case insensitive', () => {
      matcher.addSelectable(CssSelector.parse('[someAttr]'), 1);
      matcher.addSelectable(CssSelector.parse('[someAttr][someAttr2]'), 2);

      matcher.match(CssSelector.parse('[SOMEOTHERATTR]'), selectableCollector);
      expect(matched).toEqual([]);

      matcher.match(CssSelector.parse('[SOMEATTR]'), selectableCollector);
      expect(matched).toEqual([1]);

      reset();
      matcher.match(CssSelector.parse('[someAttr][someAttr2]'), selectableCollector);
      expect(matched).toEqual([1,2]);
    });

    it('should select by attr name and value case insensitive', () => {
      matcher.addSelectable(CssSelector.parse('[someAttr=someValue]'), 1);

      matcher.match(CssSelector.parse('[SOMEATTR=SOMEOTHERATTR]'), selectableCollector);
      expect(matched).toEqual([]);

      matcher.match(CssSelector.parse('[SOMEATTR=SOMEVALUE]'), selectableCollector);
      expect(matched).toEqual([1]);
    });

    it('should select by element name, class name and attribute name with value', () => {
      matcher.addSelectable(CssSelector.parse('someTag.someClass[someAttr=someValue]'), 1);

      matcher.match(CssSelector.parse('someOtherTag.someOtherClass[someOtherAttr]'), selectableCollector);
      expect(matched).toEqual([]);

      matcher.match(CssSelector.parse('someTag.someOtherClass[someOtherAttr]'), selectableCollector);
      expect(matched).toEqual([]);

      matcher.match(CssSelector.parse('someTag.someClass[someOtherAttr]'), selectableCollector);
      expect(matched).toEqual([]);

      matcher.match(CssSelector.parse('someTag.someClass[someAttr]'), selectableCollector);
      expect(matched).toEqual([]);

      matcher.match(CssSelector.parse('someTag.someClass[someAttr=someValue]'), selectableCollector);
      expect(matched).toEqual([1]);
    });

    it('should select independent of the order in the css selector', () => {
      matcher.addSelectable(CssSelector.parse('[someAttr].someClass'), 1);
      matcher.addSelectable(CssSelector.parse('.someClass[someAttr]'), 2);
      matcher.addSelectable(CssSelector.parse('.class1.class2'), 3);
      matcher.addSelectable(CssSelector.parse('.class2.class1'), 4);

      matcher.match(CssSelector.parse('[someAttr].someClass'), selectableCollector);
      expect(matched).toEqual([1,2]);

      reset();
      matcher.match(CssSelector.parse('.someClass[someAttr]'), selectableCollector);
      expect(matched).toEqual([1,2]);

      reset();
      matcher.match(CssSelector.parse('.class1.class2'), selectableCollector);
      expect(matched).toEqual([3,4]);

      reset();
      matcher.match(CssSelector.parse('.class2.class1'), selectableCollector);
      expect(matched).toEqual([4,3]);
    });
  });

  describe('CssSelector.parse', () => {
    it('should detect element names', () => {
      var cssSelector = CssSelector.parse('sometag');
      expect(cssSelector.element).toEqual('sometag');
      expect(cssSelector.toString()).toEqual('sometag');
    });

    it('should detect class names', () => {
      var cssSelector = CssSelector.parse('.someClass');
      expect(cssSelector.classNames).toEqual(['someclass']);

      expect(cssSelector.toString()).toEqual('.someclass');
    });

    it('should detect attr names', () => {
      var cssSelector = CssSelector.parse('[attrname]');
      var attr = ListWrapper.get(cssSelector.attrs, 0);
      expect(attr.name).toEqual('attrname');
      expect(isPresent(attr.value)).toBe(false);
    });

    it('should detect attr values', () => {
      var cssSelector = CssSelector.parse('[attrname=attrvalue]');
      var attr = ListWrapper.get(cssSelector.attrs, 0);
      expect(attr.name).toEqual('attrname');
      expect(attr.value).toEqual('attrvalue');
      expect(cssSelector.toString()).toEqual('[attrname=attrvalue]');
    });

    it('should detect multiple parts', () => {
      var cssSelector = CssSelector.parse('sometag[attrname=attrvalue].someclass');
      expect(cssSelector.element).toEqual('sometag');
      var attr = ListWrapper.get(cssSelector.attrs, 0);
      expect(attr.name).toEqual('attrname');
      expect(attr.value).toEqual('attrvalue');
      expect(cssSelector.classNames).toEqual(['someclass']);

      expect(cssSelector.toString()).toEqual('sometag.someclass[attrname=attrvalue]');
    });
  });
}