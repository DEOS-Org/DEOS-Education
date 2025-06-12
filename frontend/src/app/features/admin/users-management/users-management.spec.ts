import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersManagement } from './users-management';

describe('UsersManagement', () => {
  let component: UsersManagement;
  let fixture: ComponentFixture<UsersManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
