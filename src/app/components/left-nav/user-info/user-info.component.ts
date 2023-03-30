import { Component, OnInit } from '@angular/core';
import {UserService} from '../../../shared/user.service'

@Component({
  selector: 'app-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss'],
})
export class UserInfoComponent implements OnInit {

  constructor(public userService: UserService) { }

  ngOnInit() {}

}
