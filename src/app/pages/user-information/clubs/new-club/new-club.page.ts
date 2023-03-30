import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router'
import {ClubModel} from '../../../../models/club.model'
import {UserService} from '../../../../shared/user.service'
import {UserClubService} from '../../../../shared/user-club.service'

@Component({
  selector: 'app-new-club',
  templateUrl: './new-club.page.html',
  styleUrls: ['./new-club.page.scss'],
})
export class NewClubPage implements OnInit {
  club: ClubModel = {
    id: '',
    name: '',
    description: '',
    type: 'driver',
    loft: 20,
    shaft: 'graphite',
    brand: 'Titleist',
    model: 'TSi1',
    image: '',
    minDistance: 200,
    maxDistance: 300,
    current: true
  }

  constructor(
    private userService: UserService,
    private userClubService: UserClubService, private router: Router) {

  }

  ngOnInit() {
  }

  async saveClub() {
    await this.userClubService.addUserClub(this.userService.userSubject.value?.id as string, this.club);
    this.router.navigate(['/user-information/clubs']);
  }
}
