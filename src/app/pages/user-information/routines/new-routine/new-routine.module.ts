import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NewRoutinePageRoutingModule } from './new-routine-routing.module';

import { NewRoutinePage } from './new-routine.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NewRoutinePageRoutingModule
  ],
  declarations: [NewRoutinePage]
})
export class NewRoutinePageModule {}
