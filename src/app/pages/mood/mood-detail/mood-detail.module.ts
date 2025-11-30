import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoodDetailPageRoutingModule } from './mood-detail-routing.module';

import { MoodDetailPage } from './mood-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoodDetailPageRoutingModule
  ],
  declarations: [MoodDetailPage]
})
export class MoodDetailPageModule {}
