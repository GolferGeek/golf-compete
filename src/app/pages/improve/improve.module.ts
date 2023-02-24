import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ImprovePageRoutingModule } from './improve-routing.module';

import { ImprovePage } from './improve.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ImprovePageRoutingModule
  ],
  declarations: [ImprovePage]
})
export class ImprovePageModule {}
