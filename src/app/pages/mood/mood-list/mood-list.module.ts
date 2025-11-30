import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoodListPageRoutingModule } from './mood-list-routing.module';

import { MoodListPage } from './mood-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoodListPageRoutingModule
  ],
  declarations: [MoodListPage]
})
export class MoodListPageModule {}
