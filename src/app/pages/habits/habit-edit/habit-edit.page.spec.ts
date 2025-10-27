import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HabitEditPage } from './habit-edit.page';

describe('HabitEditPage', () => {
  let component: HabitEditPage;
  let fixture: ComponentFixture<HabitEditPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HabitEditPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
