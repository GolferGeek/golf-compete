import { Component, OnInit } from '@angular/core';
import {UserClubService} from '../../../shared/user-club.service'
import {UserService} from '../../../shared/user.service'

@Component({
  selector: 'app-clubs',
  templateUrl: './clubs.page.html',
  styleUrls: ['./clubs.page.scss'],
})
export class ClubsPage implements OnInit {

  constructor(public userService: UserService, public userClubService: UserClubService) { }

  ngOnInit() {
  }

}
