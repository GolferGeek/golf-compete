import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CourseAddPage } from './course-add.page';

const routes: Routes = [
  {
    path: '',
    component: CourseAddPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CourseAddPageRoutingModule {}
