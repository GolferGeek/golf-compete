import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeriesEditPageRoutingModule } from './series-edit-routing.module';

import { SeriesEditPage } from './series-edit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SeriesEditPageRoutingModule
  ],
  declarations: [SeriesEditPage]
})
export class SeriesEditPageModule {}
