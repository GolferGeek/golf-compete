import { Component, OnInit } from '@angular/core';
import {RoutineModel} from '../../../../models/routine.model'
import {ActivatedRoute, Router} from '@angular/router'
import {UserService} from '../../../../shared/user.service'
import {UserRoutineService} from '../../../../shared/user-routine.service'

@Component({
  selector: 'app-edit-routine',
  templateUrl: './edit-routine.page.html',
  styleUrls: ['./edit-routine.page.scss'],
})
export class EditRoutinePage implements OnInit {

  routineId: string;
  routine: RoutineModel;

  constructor(
    private route: ActivatedRoute,
              private userService: UserService,
              private userRoutineService: UserRoutineService,
              private router: Router)  {
      this.routineId = this.route.snapshot.paramMap.get('id') as string;
      this.routine = this.userRoutineService.getRoutine(this.routineId);

    }

  ngOnInit() {
  }

  async saveRoutine() {
    await this.userRoutineService.updateUserRoutine(this.userService.userSubject.value?.id as string, this.routine);
    this.router.navigate(['/user-information/routines']);
  }
}
