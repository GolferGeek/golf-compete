import { Component, OnInit } from '@angular/core';
import {ClubCombinationModel} from '../../../../models/club-combination.model'
import {ActivatedRoute, Router} from '@angular/router'
import {UserService} from '../../../../shared/user.service'
import {UserClubService} from '../../../../shared/user-club.service'
import {UserClubCombinationService} from '../../../../shared/user-club-combination.service'

@Component({
  selector: 'app-edit-club-combination',
  templateUrl: './edit-club-combination.page.html',
  styleUrls: ['./edit-club-combination.page.scss'],
})
export class EditClubCombinationPage implements OnInit {

  clubCombinationId: string;
  clubCombination: ClubCombinationModel;
  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private userClubCombinationService: UserClubCombinationService,
    public userClubService: UserClubService,
    private router: Router
  ) {
    this.clubCombinationId = this.route.snapshot.paramMap.get('id') as string;
    this.clubCombination = this.userClubCombinationService.getClub(this.clubCombinationId);
  }

  ngOnInit() {
  }

  async saveClubCombination() {
    await this.userClubCombinationService.updateUserClubCombination(this.userService.userSubject.value?.id as string, this.clubCombination);
    this.router.navigate(['/user-information/club-combinations']);
  }
}
