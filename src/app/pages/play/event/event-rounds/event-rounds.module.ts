import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EventRoundsPageRoutingModule } from './event-rounds-routing.module';

import { EventRoundsPage } from './event-rounds.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventRoundsPageRoutingModule
  ],
  declarations: [EventRoundsPage]
})
export class EventRoundsPageModule {}
