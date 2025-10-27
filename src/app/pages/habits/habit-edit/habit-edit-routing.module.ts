import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HabitEditPage } from './habit-edit.page';

const routes: Routes = [
  {
    path: '',
    component: HabitEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HabitEditPageRoutingModule {}
