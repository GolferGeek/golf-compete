import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import {UserService} from '../../shared/user.service'

@Component({
  selector: 'app-user-information',
  templateUrl: './user-information.page.html',
  styleUrls: ['./user-information.page.scss'],
})
export class UserInformationPage implements OnInit {

  constructor(public userService: UserService) { }

  ngOnInit() {
  }

}
