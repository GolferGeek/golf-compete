import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PracticeSessionPage } from './practice-session.page';

const routes: Routes = [
  {
    path: '',
    component: PracticeSessionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PracticeSessionPageRoutingModule {}
