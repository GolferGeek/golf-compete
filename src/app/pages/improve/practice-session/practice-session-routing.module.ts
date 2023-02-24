import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PracticeSessionPage } from './practice-session.page';

const routes: Routes = [
  {
    path: '',
    component: PracticeSessionPage
  },
  {
    path: 'game',
    loadChildren: () => import('./game/game.module').then( m => m.GamePageModule)
  },
  {
    path: 'drill',
    loadChildren: () => import('./drill/drill.module').then( m => m.DrillPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PracticeSessionPageRoutingModule {}
