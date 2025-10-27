import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HabitDetailPageRoutingModule } from './habit-detail-routing.module';

import { HabitDetailPage } from './habit-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HabitDetailPageRoutingModule
  ],
  declarations: [HabitDetailPage]
})
export class HabitDetailPageModule {}
