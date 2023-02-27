import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';

@Component({
  selector: 'app-login-logout',
  templateUrl: './login-logout.component.html',
  styleUrls: ['./login-logout.component.scss'],
})
export class LoginLogoutComponent implements OnInit {

  constructor(public authService: AuthService) { }

  login() {
    this.authService.login()
  }

  logout() {
    this.authService.logout()
  }

  ngOnInit() {}

}
