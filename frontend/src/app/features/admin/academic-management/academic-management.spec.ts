import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcademicManagement } from './academic-management';

describe('AcademicManagement', () => {
  let component: AcademicManagement;
  let fixture: ComponentFixture<AcademicManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcademicManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcademicManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
