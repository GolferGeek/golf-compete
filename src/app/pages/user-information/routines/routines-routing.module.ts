import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RoutinesPage } from './routines.page';

const routes: Routes = [
  {
    path: '',
    component: RoutinesPage
  },
  {
    path: 'new-routine',
    loadChildren: () => import('./new-routine/new-routine.module').then( m => m.NewRoutinePageModule)
  },
  {
    path: 'edit-routine/:id',
    loadChildren: () => import('./edit-routine/edit-routine.module').then( m => m.EditRoutinePageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RoutinesPageRoutingModule {}
