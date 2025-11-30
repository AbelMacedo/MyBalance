import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoodStatsPage } from './mood-stats.page';

describe('MoodStatsPage', () => {
  let component: MoodStatsPage;
  let fixture: ComponentFixture<MoodStatsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MoodStatsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
