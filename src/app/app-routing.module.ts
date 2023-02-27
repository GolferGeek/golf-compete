import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'play',
    loadChildren: () => import('./pages/play/play.module').then( m => m.PlayPageModule)
  },
  {
    path: 'improve',
    loadChildren: () => import('./pages/improve/improve.module').then( m => m.ImprovePageModule)
  },
  {
    path: 'user-information',
    loadChildren: () => import('./pages/user-information/user-information.module').then( m => m.UserInformationPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
