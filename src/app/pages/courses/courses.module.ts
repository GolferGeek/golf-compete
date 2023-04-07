import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CoursesRoutingModule } from './courses-routing.module';
import {CourseListPage} from './course-list.page'


@NgModule({
  declarations: [CourseListPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CoursesRoutingModule
  ],
})
export class CoursesModule {}
