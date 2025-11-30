import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ChallengeDetailPageRoutingModule } from './challenge-detail-routing.module';

import { ChallengeDetailPage } from './challenge-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChallengeDetailPageRoutingModule
  ],
  declarations: [ChallengeDetailPage]
})
export class ChallengeDetailPageModule {}
