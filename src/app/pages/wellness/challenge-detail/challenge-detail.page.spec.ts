import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChallengeDetailPage } from './challenge-detail.page';

describe('ChallengeDetailPage', () => {
  let component: ChallengeDetailPage;
  let fixture: ComponentFixture<ChallengeDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ChallengeDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
