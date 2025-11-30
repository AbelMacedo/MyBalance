import { TestBed } from '@angular/core/testing';

import { Wellness } from './wellness';

describe('Wellness', () => {
  let service: Wellness;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Wellness);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
