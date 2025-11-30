import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TaskCreatePageRoutingModule } from './task-create-routing.module';

import { TaskCreatePage } from './task-create.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TaskCreatePageRoutingModule
  ],
  declarations: [TaskCreatePage]
})
export class TaskCreatePageModule {}
