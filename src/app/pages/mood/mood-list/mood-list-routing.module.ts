import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MoodListPage } from './mood-list.page';

const routes: Routes = [
  {
    path: '',
    component: MoodListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MoodListPageRoutingModule {}
