import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DrillPageRoutingModule } from './drill-routing.module';

import { DrillPage } from './drill.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DrillPageRoutingModule
  ],
  declarations: [DrillPage]
})
export class DrillPageModule {}
