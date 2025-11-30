import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MoodCreatePage } from './mood-create.page';

const routes: Routes = [
  {
    path: '',
    component: MoodCreatePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MoodCreatePageRoutingModule {}
