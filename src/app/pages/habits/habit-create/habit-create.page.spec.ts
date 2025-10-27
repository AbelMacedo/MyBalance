import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HabitCreatePage } from './habit-create.page';

describe('HabitCreatePage', () => {
  let component: HabitCreatePage;
  let fixture: ComponentFixture<HabitCreatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HabitCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
