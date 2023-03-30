import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditClubCombinationPageRoutingModule } from './edit-club-combination-routing.module';

import { EditClubCombinationPage } from './edit-club-combination.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditClubCombinationPageRoutingModule
  ],
  declarations: [EditClubCombinationPage]
})
export class EditClubCombinationPageModule {}
