import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CourseNewPageRoutingModule } from './course-new-routing.module';

import { CourseNewPage } from './course-new.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CourseNewPageRoutingModule
  ],
  declarations: [CourseNewPage]
})
export class CourseNewPageModule {}
