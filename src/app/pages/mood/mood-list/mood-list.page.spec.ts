import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoodListPage } from './mood-list.page';

describe('MoodListPage', () => {
  let component: MoodListPage;
  let fixture: ComponentFixture<MoodListPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MoodListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
