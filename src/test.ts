/* eslint-disable jest/require-hook */
import { ApplicationModule } from '@angular/core';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { ngMocks } from 'ng-mocks';
import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

ngMocks.autoSpy('jest');

ngMocks.globalKeep(ApplicationModule, true);
ngMocks.globalKeep(BrowserModule, true);
ngMocks.globalKeep(CommonModule, true);

TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
