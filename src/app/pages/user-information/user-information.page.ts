import { Component, OnInit } from '@angular/core';
import { states} from '../../shared/data/state.data'
import {UserService} from '../../shared/user.service'

@Component({
  selector: 'app-user-information',
  templateUrl: './user-information.page.html',
  styleUrls: ['./user-information.page.scss'],
})
export class UserInformationPage implements OnInit {

  states = states;

  constructor(public userService: UserService) { }

  ngOnInit() {
  }

}
