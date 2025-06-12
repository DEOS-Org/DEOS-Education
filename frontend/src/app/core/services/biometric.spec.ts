import { TestBed } from '@angular/core/testing';

import { Biometric } from './biometric';

describe('Biometric', () => {
  let service: Biometric;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Biometric);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
