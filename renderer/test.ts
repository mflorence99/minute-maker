import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { TestBed } from '@angular/core/testing';
import { TextEncoder } from 'util';

import { platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

// @see https://github.com/thymikee/jest-preset-angular/

Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>'
});

// @see https://github.com/angular/material2/issues/7101
Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true
    };
  }
});

Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: () => {}
});

Object.defineProperty(Element.prototype, 'scrollTo', {
  value: () => {}
});

Object.defineProperty(window, 'CSS', { value: null });

Object.defineProperty(window, 'IntersectionObserver', {
  value: class {
    disconnect(): any {}
    observe(): any {}
    unobserve(): any {}
  }
});

Object.defineProperty(window, 'ResizeObserver', {
  value: class {
    disconnect(): any {}
    observe(): any {}
    unobserve(): any {}
  }
});

// 🙈 https://github.com/angular/angular/issues/48748
Object.defineProperty(window, 'TextEncoder', {
  value: TextEncoder
});

Object.defineProperty(window, 'WaveSurfer', { value: null });

TestBed.initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
