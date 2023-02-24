import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RoundPage } from './round.page';

const routes: Routes = [
  {
    path: '',
    component: RoundPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RoundPageRoutingModule {}
