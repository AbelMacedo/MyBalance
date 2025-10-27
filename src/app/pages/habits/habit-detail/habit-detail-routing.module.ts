import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HabitDetailPage } from './habit-detail.page';

const routes: Routes = [
  {
    path: '',
    component: HabitDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HabitDetailPageRoutingModule {}
