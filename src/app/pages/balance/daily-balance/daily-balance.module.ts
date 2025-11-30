import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';


import { IonicModule } from '@ionic/angular';

import { DailyBalancePageRoutingModule } from './daily-balance-routing.module';

import { DailyBalancePage } from './daily-balance.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    DailyBalancePageRoutingModule
  ],
  declarations: [DailyBalancePage]
})
export class DailyBalancePageModule {}
