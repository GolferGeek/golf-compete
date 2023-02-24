import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeriesAddPageRoutingModule } from './series-add-routing.module';

import { SeriesAddPage } from './series-add.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SeriesAddPageRoutingModule
  ],
  declarations: [SeriesAddPage]
})
export class SeriesAddPageModule {}
