/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injectable} from '@angular/core';
import {ListWrapper, Predicate} from '@angular/core/src/facade/collection';

// base model for RecordStore
export class KeyModel {
  constructor(public key: number) {}
}

export class Todo extends KeyModel {
  editTitle: string;
  constructor(key: number, public title: string, public completed: boolean) {
    super(key);
    this.editTitle = title;
  }
}

@Injectable()
export class TodoFactory {
  _uid: number = 0;

  nextUid(): number { return ++this._uid; }

  create(title: string, isCompleted: boolean): Todo {
    return new Todo(this.nextUid(), title, isCompleted);
  }
}

// Store manages any generic item that inherits from KeyModel
@Injectable()
export class Store {
  list: KeyModel[] = [];

  add(record: KeyModel): void { this.list.push(record); }

  remove(record: KeyModel): void { this._spliceOut(record); }

  removeBy(callback: Predicate<KeyModel>): void {
    var records = this.list.filter(callback);
    ListWrapper.removeAll(this.list, records);
  }

  private _spliceOut(record: KeyModel) {
    var i = this._indexFor(record);
    if (i > -1) {
      return this.list.splice(i, 1)[0];
    }
    return null;
  }

  private _indexFor(record: KeyModel) { return this.list.indexOf(record); }
}
