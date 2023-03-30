import { Component, OnInit } from '@angular/core';
import {UserRoutineService} from '../../../shared/user-routine.service'

@Component({
  selector: 'app-routines',
  templateUrl: './routines.page.html',
  styleUrls: ['./routines.page.scss'],
})
export class RoutinesPage implements OnInit {

  constructor(public userRoutineService: UserRoutineService) { }

  ngOnInit() {
  }

}
