/* tslint:disable: member-ordering forin */
// #docregion
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { forbiddenNameValidator } from '../shared/forbidden-name.directive';
import { identityRevealedValidator } from '../shared/identity-revealed.directive';

// #docregion cross-validation-component
@Component({
  selector: 'app-hero-form-reactive',
  templateUrl: './hero-form-reactive.component.html',
  styleUrls: ['./hero-form-reactive.component.css'],
})
export class HeroFormReactiveComponent implements OnInit {
// #enddocregion cross-validation-component

  powers = ['Really Smart', 'Super Flexible', 'Weather Changer'];

  hero = { name: 'Dr.', alterEgo: 'Dr. What', power: this.powers[0] };

  // #docregion cross-validation-component
  heroForm: FormGroup;

  // #docregion cross-validation-register
  ngOnInit(): void {
    this.heroForm = new FormGroup({
      'name': new FormControl(this.hero.name, [
        Validators.required,
        Validators.minLength(4),
        forbiddenNameValidator(/bob/i)
      ]),
      'alterEgo': new FormControl(this.hero.alterEgo),
      'power': new FormControl(this.hero.power, Validators.required)
    },  { validators: identityRevealedValidator }); // <-- add custom validator at the FormGroup level
  }
  // #enddocregion cross-validation-register
  // #enddocregion cross-validation-component

  get name() { return this.heroForm.get('name'); }

  get power() { return this.heroForm.get('power'); }
// #docregion cross-validation-component
}
// #enddocregion cross-validation-component
