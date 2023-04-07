import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CourseNewPage } from './course-new.page';

const routes: Routes = [
  {
    path: '',
    component: CourseNewPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CourseNewPageRoutingModule {}
