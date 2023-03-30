import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditClubPageRoutingModule } from './edit-club-routing.module';

import { EditClubPage } from './edit-club.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditClubPageRoutingModule
  ],
  declarations: [EditClubPage]
})
export class EditClubPageModule {}
