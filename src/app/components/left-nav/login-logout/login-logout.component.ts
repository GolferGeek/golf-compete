import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/auth.service';
import {Router} from '@angular/router'

@Component({
  selector: 'app-login-logout',
  templateUrl: './login-logout.component.html',
  styleUrls: ['./login-logout.component.scss'],
})
export class LoginLogoutComponent implements OnInit {

  constructor(public authService: AuthService, private router: Router) { }

  login() {
    this.router.navigateByUrl('/auth/login');
  }

  logout() {
    this.authService.logout()
  }

  ngOnInit() {}

}
