import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {CourseListPage} from './course-list.page'



const routes: Routes = [
  {
    path: '',
    component: CourseListPage
  },
  {
    path: 'new-course',
    loadChildren: () => import('./course-new/course-new.module').then(m => m.CourseNewPageModule)
  },
  {
    path: 'edit-course/:id',
    loadChildren: () => import('./course-edit/course-edit.module').then( m => m.CourseEditPageModule)
  },
  {
    path: 'course-detail',
    loadChildren: () => import('./course-detail/course-detail.module').then( m => m.CourseDetailPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CoursesRoutingModule {}
