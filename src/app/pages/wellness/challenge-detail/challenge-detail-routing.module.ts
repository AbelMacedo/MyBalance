import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ChallengeDetailPage } from './challenge-detail.page';

const routes: Routes = [
  {
    path: '',
    component: ChallengeDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ChallengeDetailPageRoutingModule {}
