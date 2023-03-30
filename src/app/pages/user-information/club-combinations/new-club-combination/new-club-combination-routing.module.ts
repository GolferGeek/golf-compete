import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NewClubCombinationPage } from './new-club-combination.page';

const routes: Routes = [
  {
    path: '',
    component: NewClubCombinationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewClubCombinationPageRoutingModule {}
