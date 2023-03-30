import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ClubCombinationsPageRoutingModule } from './club-combinations-routing.module';

import { ClubCombinationsPage } from './club-combinations.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ClubCombinationsPageRoutingModule
  ],
  declarations: [ClubCombinationsPage]
})
export class ClubCombinationsPageModule {}
