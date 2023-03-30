import { Component, OnInit } from '@angular/core';
import {ClubCombinationModel} from '../../../../models/club-combination.model'
import {UserClubCombinationService} from '../../../../shared/user-club-combination.service'
import {Router} from '@angular/router'
import {UserService} from '../../../../shared/user.service'
import {UserClubService} from '../../../../shared/user-club.service'

@Component({
  selector: 'app-new-club-combination',
  templateUrl: './new-club-combination.page.html',
  styleUrls: ['./new-club-combination.page.scss'],
})
export class NewClubCombinationPage implements OnInit {

  clubCombination: ClubCombinationModel = {
    id: '',
    name: '',
    description: '',
    clubs: [],
    picture: '',
    current: true
  }

  constructor(
    public userClubCombinationService: UserClubCombinationService,
    public userClubService: UserClubService,
    private router: Router,
    private userService: UserService) {

  }

  ngOnInit() {
  }
  saveClubCombination() {
    this.userClubCombinationService.addUserClubCombination(this.userService.userSubject.value?.id as string, this.clubCombination);
    this.router.navigate(['/user-information/club-combinations']);
  }

}
