import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DrillPage } from './drill.page';

const routes: Routes = [
  {
    path: '',
    component: DrillPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DrillPageRoutingModule {}
