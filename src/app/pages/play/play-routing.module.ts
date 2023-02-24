import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlayPage } from './play.page';

const routes: Routes = [
  {
    path: '',
    component: PlayPage
  },
  {
    path: 'series-list',
    loadChildren: () => import('./series/series-list/series-list.module').then(m => m.SeriesListPageModule)
  },
  {
    path: 'series-add',
    loadChildren: () => import('./series/series-add/series-add.module').then(m => m.SeriesAddPageModule)
  },
  {
    path: 'series-edit',
    loadChildren: () => import('./series/series-edit/series-edit.module').then(m => m.SeriesEditPageModule)
  },
  {
    path: 'series-detail',
    loadChildren: () => import('./series/series-detail/series-detail.module').then(m => m.SeriesDetailPageModule)
  },
  {
    path: 'event-list',
    loadChildren: () => import('./event/event-list/event-list.module').then( m => m.EventListPageModule)
  },
  {
    path: 'event-add',
    loadChildren: () => import('./event/event-add/event-add.module').then( m => m.EventAddPageModule)
  },
  {
    path: 'event-edit',
    loadChildren: () => import('./event/event-edit/event-edit.module').then( m => m.EventEditPageModule)
  },
  {
    path: 'event-detail',
    loadChildren: () => import('./event/event-detail/event-detail.module').then( m => m.EventDetailPageModule)
  },
  {
    path: 'event-rounds',
    loadChildren: () => import('./event/event-rounds/event-rounds.module').then( m => m.EventRoundsPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlayPageRoutingModule {}
