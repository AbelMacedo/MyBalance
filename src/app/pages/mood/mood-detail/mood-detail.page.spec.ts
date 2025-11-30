import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoodDetailPage } from './mood-detail.page';

describe('MoodDetailPage', () => {
  let component: MoodDetailPage;
  let fixture: ComponentFixture<MoodDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MoodDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
