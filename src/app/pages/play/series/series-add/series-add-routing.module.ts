import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SeriesAddPage } from './series-add.page';

const routes: Routes = [
  {
    path: '',
    component: SeriesAddPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SeriesAddPageRoutingModule {}
