import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ImprovePage } from './improve.page';

const routes: Routes = [
  {
    path: '',
    component: ImprovePage
  },
  {
    path: 'practice-session',
    loadChildren: () => import('./practice-session/practice-session.module').then( m => m.PracticeSessionPageModule)
  },
  {
    path: 'round',
    loadChildren: () => import('./round/round.module').then( m => m.RoundPageModule)
  },
  {
    path: 'evaluation',
    loadChildren: () => import('./evaluation/evaluation.module').then( m => m.EvaluationPageModule)
  },
  {
    path: 'routines',
    loadChildren: () => import('./routines/routines.module').then( m => m.RoutinesPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImprovePageRoutingModule {}
