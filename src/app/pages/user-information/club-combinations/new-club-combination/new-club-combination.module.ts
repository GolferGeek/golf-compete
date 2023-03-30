import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NewClubCombinationPageRoutingModule } from './new-club-combination-routing.module';

import { NewClubCombinationPage } from './new-club-combination.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NewClubCombinationPageRoutingModule
  ],
  declarations: [NewClubCombinationPage]
})
export class NewClubCombinationPageModule {}
