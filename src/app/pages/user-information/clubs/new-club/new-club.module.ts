import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NewClubPageRoutingModule } from './new-club-routing.module';

import { NewClubPage } from './new-club.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NewClubPageRoutingModule
  ],
  declarations: [NewClubPage]
})
export class NewClubPageModule {}
