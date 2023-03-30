import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NewRoutinePage } from './new-routine.page';

const routes: Routes = [
  {
    path: '',
    component: NewRoutinePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewRoutinePageRoutingModule {}
