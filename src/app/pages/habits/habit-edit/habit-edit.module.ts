import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HabitEditPageRoutingModule } from './habit-edit-routing.module';

import { HabitEditPage } from './habit-edit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HabitEditPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [HabitEditPage]
})
export class HabitEditPageModule {}
