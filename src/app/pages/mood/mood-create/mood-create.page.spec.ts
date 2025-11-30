import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MoodCreatePage } from './mood-create.page';

describe('MoodCreatePage', () => {
  let component: MoodCreatePage;
  let fixture: ComponentFixture<MoodCreatePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MoodCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
