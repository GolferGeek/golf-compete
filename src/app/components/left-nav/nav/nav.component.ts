import { Component, OnInit } from '@angular/core';
import {AuthService} from '../../../shared/auth.service'
import {UserService} from '../../../shared/user.service'

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {

  constructor(public userService: UserService) { }

  ngOnInit() {}

}
