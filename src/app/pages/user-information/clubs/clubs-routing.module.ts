import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClubsPage } from './clubs.page';

const routes: Routes = [
  {
    path: '',
    component: ClubsPage
  },
  {
    path: 'new-club',
    loadChildren: () => import('./new-club/new-club.module').then( m => m.NewClubPageModule)
  },
  {
    path: 'edit-club/:id',
    loadChildren: () => import('./edit-club/edit-club.module').then( m => m.EditClubPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClubsPageRoutingModule {}
