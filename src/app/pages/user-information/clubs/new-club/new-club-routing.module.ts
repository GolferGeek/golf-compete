import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NewClubPage } from './new-club.page';

const routes: Routes = [
  {
    path: '',
    component: NewClubPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewClubPageRoutingModule {}
