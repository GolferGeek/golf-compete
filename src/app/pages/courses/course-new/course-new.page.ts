import {Component, OnInit} from '@angular/core';
import {CourseModel} from '../../../models/course/course.model'
import {Router} from '@angular/router'
import {UserService} from '../../../shared/user.service'
import {CourseService} from '../../../shared/course.service'

@Component({
  selector: 'app-course-new',
  templateUrl: './course-new.page.html',
  styleUrls: ['./course-new.page.scss'],
})
export class CourseNewPage implements OnInit {

  course: Partial<CourseModel> = {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    website: '',
    teeBoxes: [],
    sides: [],
  }

  constructor(
    private router: Router,
    private userService: UserService,
    private courseService: CourseService,
  ) {
  }

  ngOnInit() {
  }

  saveCourse() {
    this.courseService.addCourse(this.course);
    this.router.navigate(['/courses']);
  }

}
