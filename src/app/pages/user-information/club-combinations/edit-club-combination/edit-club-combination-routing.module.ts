import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditClubCombinationPage } from './edit-club-combination.page';

const routes: Routes = [
  {
    path: '',
    component: EditClubCombinationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditClubCombinationPageRoutingModule {}
