import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserInformationPage } from './user-information.page';

const routes: Routes = [
  {
    path: '',
    component: UserInformationPage
  },
  {
    path: 'routines',
    loadChildren: () => import('./routines/routines.module').then( m => m.RoutinesPageModule)
  },
  {
    path: 'clubs',
    loadChildren: () => import('./clubs/clubs.module').then( m => m.ClubsPageModule)
  },
  {
    path: 'club-combinations',
    loadChildren: () => import('./club-combinations/club-combinations.module').then( m => m.ClubCombinationsPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserInformationPageRoutingModule {}
