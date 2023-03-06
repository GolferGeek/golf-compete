import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CourseEditPage } from './course-edit.page';

const routes: Routes = [
  {
    path: '',
    component: CourseEditPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CourseEditPageRoutingModule {}
