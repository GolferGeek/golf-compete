import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SeriesDetailPage } from './series-detail.page';

const routes: Routes = [
  {
    path: '',
    component: SeriesDetailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SeriesDetailPageRoutingModule {}
