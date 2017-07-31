import { Component, ComponentRef, DoCheck, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/takeUntil';

import { DocumentContents } from 'app/documents/document.service';
import { EmbedComponentsService } from 'app/embed-components/embed-components.service';
import { Logger } from 'app/shared/logger.service';
import { TocService } from 'app/shared/toc.service';


// Initialization prevents flicker once pre-rendering is on
const initialDocViewerElement = document.querySelector('aio-doc-viewer');
const initialDocViewerContent = initialDocViewerElement ? initialDocViewerElement.innerHTML : '';

@Component({
  selector: 'aio-doc-viewer',
  template: ''
  // TODO(robwormald): shadow DOM and emulated don't work here (?!)
  // encapsulation: ViewEncapsulation.Native
})
export class DocViewerComponent implements DoCheck, OnDestroy {

  private hostElement: HTMLElement;

  private void$ = of<void>(undefined);
  private onDestroy$ = new EventEmitter<void>();
  private docContents$ = new EventEmitter<DocumentContents>();

  protected embeddedComponentRefs: ComponentRef<any>[] = [];

  @Input()
  set doc(newDoc: DocumentContents) {
    // Ignore `undefined` values that could happen if the host component
    // does not initially specify a value for the `doc` input.
    if (newDoc) {
      this.docContents$.emit(newDoc);
    }
  }

  @Output()
  docRendered = new EventEmitter<void>();

  constructor(
    elementRef: ElementRef,
    private embedComponentsService: EmbedComponentsService,
    private logger: Logger,
    private titleService: Title,
    private tocService: TocService
    ) {
    this.hostElement = elementRef.nativeElement;
    // Security: the initialDocViewerContent comes from the prerendered DOM and is considered to be secure
    this.hostElement.innerHTML = initialDocViewerContent;

    this.onDestroy$.subscribe(() => this.destroyEmbeddedComponents());
    this.docContents$
        .do(() => this.destroyEmbeddedComponents())
        .switchMap(newDoc => this.render(newDoc))
        .do(() => this.docRendered.emit())
        .takeUntil(this.onDestroy$)
        .subscribe();
  }

  ngDoCheck() {
    this.embeddedComponentRefs.forEach(comp => comp.changeDetectorRef.detectChanges());
  }

  ngOnDestroy() {
    this.onDestroy$.emit();
  }

  /**
   * Set up the window title and ToC.
   */
  protected addTitleAndToc(docId: string): void {
    this.tocService.reset();
    const titleEl = this.hostElement.querySelector('h1');
    let title = '';

    // Only create TOC for docs with an <h1> title
    // If you don't want a TOC, add "no-toc" class to <h1>
    if (titleEl) {
      title = (typeof titleEl.innerText === 'string') ? titleEl.innerText : titleEl.textContent;
      if (!/(no-toc|notoc)/i.test(titleEl.className)) {
        this.tocService.genToc(this.hostElement, docId);
        titleEl.insertAdjacentHTML('afterend', '<aio-toc class="embedded"></aio-toc>');
      }
    }

    this.titleService.setTitle(title ? `Angular - ${title}` : 'Angular');
  }

  /**
   * Destroy the embedded components to avoid memory leaks.
   */
  protected destroyEmbeddedComponents(): void {
    this.embeddedComponentRefs.forEach(comp => comp.destroy());
    this.embeddedComponentRefs = [];
  }

  /**
   * Add doc content to host element and build it out with embedded components.
   */
  protected render(doc: DocumentContents): Observable<void> {
    return this.void$
        .do(() => {
          // Security: `doc.contents` is always authored by the documentation team
          //           and is considered to be safe.
          this.hostElement.innerHTML = doc.contents || '';
          this.addTitleAndToc(doc.id);
        })
        .switchMap(() => this.embedComponentsService.embedInto(this.hostElement))
        .do(componentRefs => this.embeddedComponentRefs = componentRefs)
        .switchMap(() => this.void$)
        .catch(err => {
          this.logger.error(`[DocViewer]: Error preparing document '${doc.id}'.`, err);
          return this.void$;
        });
  }
}
