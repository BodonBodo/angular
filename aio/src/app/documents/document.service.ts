import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import { AsyncSubject } from 'rxjs/AsyncSubject';
import 'rxjs/add/operator/switchMap';

import { LocationService } from 'app/shared/location.service';
import { Logger } from 'app/shared/logger.service';

const FILE_NOT_FOUND_DOC = 'file-not-found';

export interface DocumentContents {
  title: string;
  contents: string;
}

@Injectable()
export class DocumentService {

  private cache = new Map<string, Observable<DocumentContents>>();

  currentDocument: Observable<DocumentContents>;

  constructor(private logger: Logger, private http: Http, location: LocationService) {
    // Whenever the URL changes we try to get the appropriate doc
    this.currentDocument = location.currentUrl.switchMap(url => this.getDocument(url));
  }

  private getDocument(url: string) {
    this.logger.log('getting document', url);
    const path = this.computePath(url);
    if ( !this.cache.has(path)) {
      this.cache.set(path, this.fetchDocument(path));
    }
    return this.cache.get(path);
  }

  private fetchDocument(path: string) {
    this.logger.log('fetching document from', path);
    const subject = new AsyncSubject();
    this.http
      .get(path)
      .map(res => res.json())
      .catch((error: Response) => {
        if (error.status === 404 && path !== FILE_NOT_FOUND_DOC) {
          this.logger.error(`Document file not found at '${path}'`);
          // using `getDocument` means that we can fetch the 404 doc contents from the server and cache it
          return this.getDocument(FILE_NOT_FOUND_DOC);
        } else {
          throw error;
        }
      })
      .subscribe(subject);
    return subject.asObservable();
  }

  private computePath(url) {
    url = url.startsWith('/') ? url : '/' + url;
    url = url.endsWith('/') ? url + 'index' : url;
    return 'content/docs' + url + '.json';
  }
}
