import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DailyBalancePage } from './daily-balance.page';

const routes: Routes = [
  {
    path: '',
    component: DailyBalancePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DailyBalancePageRoutingModule {}
