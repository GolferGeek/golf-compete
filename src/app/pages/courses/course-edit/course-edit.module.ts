import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CourseEditPageRoutingModule } from './course-edit-routing.module';

import { CourseEditPage } from './course-edit.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CourseEditPageRoutingModule
  ],
  declarations: [CourseEditPage]
})
export class CourseEditPageModule {}
