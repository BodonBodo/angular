import { DirectiveExplorerComponent } from './directive-explorer.component';
import { ComponentExplorerViewQuery, PropertyQueryTypes } from 'protocol';
import { IndexedNode } from './directive-forest/index-forest';
import SpyObj = jasmine.SpyObj;
import { ElementPropertyResolver } from './property-resolver/element-property-resolver';

describe('DirectiveExplorerComponent', () => {
  let messageBusMock: any;
  let comp: DirectiveExplorerComponent;
  let applicationOperationsSpy: any;
  let snackBarSpy: any;

  beforeEach(() => {
    applicationOperationsSpy = jasmine.createSpyObj('_appOperations', ['viewSource', 'selectDomElement']);
    snackBarSpy = jasmine.createSpyObj('_snackBar', ['show']);
    messageBusMock = jasmine.createSpyObj('messageBus', ['on', 'once', 'emit', 'destroy']);
    comp = new DirectiveExplorerComponent(
      applicationOperationsSpy,
      snackBarSpy,
      messageBusMock,
      new ElementPropertyResolver(messageBusMock)
    );
  });

  it('should create instance from class', () => {
    expect(comp).toBeTruthy();
  });

  it('subscribe to backend events', () => {
    comp.subscribeToBackendEvents();
    expect(messageBusMock.on).toHaveBeenCalledTimes(4);
    expect(messageBusMock.on).toHaveBeenCalledWith('latestComponentExplorerView', jasmine.any(Function));
    expect(messageBusMock.on).toHaveBeenCalledWith('highlightComponentInTreeFromElement', jasmine.any(Function));
    expect(messageBusMock.on).toHaveBeenCalledWith('removeHighlightFromComponentTree', jasmine.any(Function));
    expect(messageBusMock.on).toHaveBeenCalledWith('componentTreeDirty', jasmine.any(Function));
  });

  describe('refresh', () => {
    it('should emit getLatestComponentExplorerView event on refresh', () => {
      comp.refresh();
      expect(messageBusMock.emit).toHaveBeenCalledTimes(1);
    });

    it('should emit getLatestComponentExplorerView event with null view query', () => {
      comp.refresh();
      expect(messageBusMock.emit).toHaveBeenCalledWith('getLatestComponentExplorerView', [undefined]);
    });

    it('should emit getLatestComponentExplorerView event on refresh with view query no properties', () => {
      const currentSelectedElement = jasmine.createSpyObj('currentSelectedElement', ['position', 'children']);
      currentSelectedElement.position = [0];
      currentSelectedElement.children = [];
      comp.currentSelectedElement = currentSelectedElement;
      const propertyTab = {
        propertyTabBody: {
          propertyViews: jasmine.createSpyObj('propertyTab', ['toArray']),
        },
      };
      comp.refresh();
      expect(comp.currentSelectedElement).toBeTruthy();
      expect(messageBusMock.emit).toHaveBeenCalledWith('getLatestComponentExplorerView', [undefined]);
    });
  });

  describe('node selection event', () => {
    let nodeMock: SpyObj<IndexedNode>;

    beforeEach(() => {
      nodeMock = jasmine.createSpyObj('node', ['position', 'children']);
    });

    it('fires node selection events', () => {
      const position = [0];
      nodeMock.position = position;
      comp.handleNodeSelection(nodeMock);
      expect(messageBusMock.emit).toHaveBeenCalledTimes(2);
      expect(messageBusMock.emit).toHaveBeenCalledWith('setSelectedComponent', [nodeMock.position]);
      expect(messageBusMock.emit).toHaveBeenCalledWith('getLatestComponentExplorerView', [
        {
          selectedElement: position,
          propertyQuery: {
            type: PropertyQueryTypes.All,
          },
        },
      ]);
    });
  });
});
