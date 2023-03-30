import { Component, OnInit } from '@angular/core';
import {RoutineModel} from '../../../../models/routine.model'
import {Router} from '@angular/router'
import {UserRoutineService} from '../../../../shared/user-routine.service'
import {UserService} from '../../../../shared/user.service'

@Component({
  selector: 'app-new-routine',
  templateUrl: './new-routine.page.html',
  styleUrls: ['./new-routine.page.scss'],
})
export class NewRoutinePage implements OnInit {

  routine: Partial<RoutineModel> = {
    name: '',
    description: '',
    type: 'Pre-Shot',
    current: true
  }
  constructor(
    private userService: UserService,
    private userRoutineService: UserRoutineService, private router: Router
  ) { }

  ngOnInit() {
  }

  async saveRoutine() {
    await this.userRoutineService.addUserRoutine(this.userService.userSubject.value?.id as string, this.routine);
    this.router.navigate(['/user-information/routines']);
  }

}
