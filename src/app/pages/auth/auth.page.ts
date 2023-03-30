import {Component} from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import {doc, Firestore, setDoc} from '@angular/fire/firestore';
import {ActivatedRoute, Router} from '@angular/router';
import {AlertController} from '@ionic/angular';
import {AuthService} from '../../shared/auth.service'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage {
  authMode: string = 'login';
  pageTitle = 'Login';
  credentials: { email: string; password: string } = {
    email: '',
    password: '',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly alertController: AlertController,
    public authService: AuthService,
  ) {
    this.setPageTitle();
  }

  setPageTitle() {
    this.authMode = this.route.snapshot.params['authMode'];
    switch (this.authMode) {
      case 'reset':
        this.pageTitle = 'Reset Password';
        break;
      case 'signup':
        this.pageTitle = 'Create Account';
        break;
      default:
        this.pageTitle = 'Login';
        break;
    }
  }

  loginWithGoogle() {
    this.authService.signInWithGoogle();
  }


  handleAuthForm({email, password}: { email: string; password: string }) {
    switch (this.authMode) {
      case 'login':
        this.authService.login(email, password);
        break;
      case 'signup':
          this.authService.register(email, password);
        break;
      case 'reset':
        this.authService.resetPassword(email);
        this.displayResetAlert();
        break;
      default:
        break;
    }
  }

  async displayResetAlert() {
    const alert = await this.alertController.create({
      message:
        'We just sent you a password reset link, please check your email.',
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          handler: () => {
            this.router.navigateByUrl('');
          },
        },
      ],
    });
    await alert.present();
  }
}
