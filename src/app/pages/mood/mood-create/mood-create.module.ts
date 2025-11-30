import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MoodCreatePageRoutingModule } from './mood-create-routing.module';

import { MoodCreatePage } from './mood-create.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MoodCreatePageRoutingModule
  ],
  declarations: [MoodCreatePage]
})
export class MoodCreatePageModule {}
