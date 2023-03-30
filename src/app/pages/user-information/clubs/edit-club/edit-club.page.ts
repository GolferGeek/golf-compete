import { Component, OnInit } from '@angular/core';
import {ClubModel} from '../../../../models/club.model'
import {ActivatedRoute, Router} from '@angular/router'
import {UserService} from '../../../../shared/user.service'

@Component({
  selector: 'app-edit-club',
  templateUrl: './edit-club.page.html',
  styleUrls: ['./edit-club.page.scss'],
})
export class EditClubPage implements OnInit {

  clubId: string;
  club: ClubModel

  constructor(private route: ActivatedRoute, private userService: UserService, private router: Router) {
    this.clubId = this.route.snapshot.paramMap.get('id') as string;
    this.club = this.userService.getClub(this.clubId);
  }

  ngOnInit() {
  }

  saveClub() {
    this.userService.updateUserClub(this.userService.userSubject.value?.id as string, this.club);
    this.router.navigate(['/user-information/clubs']);
  }

}
