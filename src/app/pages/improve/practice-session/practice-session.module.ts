import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PracticeSessionPageRoutingModule } from './practice-session-routing.module';

import { PracticeSessionPage } from './practice-session.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PracticeSessionPageRoutingModule
  ],
  declarations: [PracticeSessionPage]
})
export class PracticeSessionPageModule {}
