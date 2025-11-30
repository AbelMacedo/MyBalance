import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DailyBalancePage } from './daily-balance.page';

describe('DailyBalancePage', () => {
  let component: DailyBalancePage;
  let fixture: ComponentFixture<DailyBalancePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DailyBalancePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
