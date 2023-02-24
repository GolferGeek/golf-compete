import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeriesListPageRoutingModule } from './series-list-routing.module';

import { SeriesListPage } from './series-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SeriesListPageRoutingModule
  ],
  declarations: [SeriesListPage]
})
export class SeriesListPageModule {}
