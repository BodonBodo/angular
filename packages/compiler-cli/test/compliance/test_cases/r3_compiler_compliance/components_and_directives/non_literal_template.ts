import {Component} from '@angular/core';

const myTemplate = `<div *ngIf="show">Hello</div>`;

@Component({selector: 'test-cmp', template: myTemplate})
export class TestCmp {
}
