import { RootModule } from '../../module';
import { RootPage } from './page';

import 'jest-extended';

import { TestBed } from '@angular/core/testing';

import { ngMocks } from 'ng-mocks';

function setup(): RootPage {
  TestBed.configureTestingModule(
    ngMocks.guts([RootPage], RootModule)
  ).compileComponents();
  return TestBed.createComponent(RootPage).componentInstance;
}

describe('the RootPage', () => {
  it('should create the page', () => {
    expect.assertions(1);
    const page = setup();
    expect(page).toBeTruthy();
  });

  it('should load the environment as a property', () => {
    expect.assertions(1);
    const page = setup();
    expect(page.env.production).toBeFalse();
  });
});
