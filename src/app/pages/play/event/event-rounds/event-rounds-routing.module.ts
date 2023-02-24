import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EventRoundsPage } from './event-rounds.page';

const routes: Routes = [
  {
    path: '',
    component: EventRoundsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventRoundsPageRoutingModule {}
