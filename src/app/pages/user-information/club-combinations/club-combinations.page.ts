import { Component, OnInit } from '@angular/core';
import {UserClubCombinationService} from '../../../shared/user-club-combination.service'

@Component({
  selector: 'app-club-combinations',
  templateUrl: './club-combinations.page.html',
  styleUrls: ['./club-combinations.page.scss'],
})
export class ClubCombinationsPage implements OnInit {

  constructor(public userClubCombinationService: UserClubCombinationService) { }

  ngOnInit() {
  }

}
