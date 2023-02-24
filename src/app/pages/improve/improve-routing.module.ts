import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ImprovePage } from './improve.page';

const routes: Routes = [
  {
    path: '',
    component: ImprovePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImprovePageRoutingModule {}
