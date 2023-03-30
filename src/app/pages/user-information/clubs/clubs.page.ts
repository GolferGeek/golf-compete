import { Component, OnInit } from '@angular/core';
import {UserService} from '../../../shared/user.service'
import {AuthService} from '../../../shared/auth.service'

@Component({
  selector: 'app-clubs',
  templateUrl: './clubs.page.html',
  styleUrls: ['./clubs.page.scss'],
})
export class ClubsPage implements OnInit {

  constructor(public userService: UserService) { }

  ngOnInit() {
  }

}
