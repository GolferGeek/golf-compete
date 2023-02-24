import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeriesDetailPageRoutingModule } from './series-detail-routing.module';

import { SeriesDetailPage } from './series-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SeriesDetailPageRoutingModule
  ],
  declarations: [SeriesDetailPage]
})
export class SeriesDetailPageModule {}
