import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClubCombinationsPage } from './club-combinations.page';

const routes: Routes = [
  {
    path: '',
    component: ClubCombinationsPage
  },
  {
    path: 'new-club-combination',
    loadChildren: () => import('./new-club-combination/new-club-combination.module').then( m => m.NewClubCombinationPageModule)
  },
  {
    path: 'edit-club-combination/:id',
    loadChildren: () => import('./edit-club-combination/edit-club-combination.module').then( m => m.EditClubCombinationPageModule)
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClubCombinationsPageRoutingModule {}
