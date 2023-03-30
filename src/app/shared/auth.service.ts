import {Injectable} from '@angular/core';
import {
  getAuth,
  GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from '@angular/fire/auth';
import {
  getFirestore,
} from '@angular/fire/firestore';
import {Router} from '@angular/router'
import {AlertController} from '@ionic/angular'

@Injectable({providedIn: 'root'})
export class AuthService {
  loggedIn = false;
  fbAuth = getAuth();
  firestore = getFirestore();

  constructor(private router: Router, private alertController: AlertController) {
    this.fbAuth.onAuthStateChanged( async (fbUser) => {
      if (fbUser) {
        this.loggedIn = true;


      } else {
        this.loggedIn = false;
      }
    });
  }

  login(email: string, password: string) {
    signInWithEmailAndPassword(this.fbAuth, email, password).then(() => {
      this.router.navigateByUrl('/home');
    });
  }

  register(email: string, password: string) {
    signInWithEmailAndPassword(this.fbAuth, email, password).then(() => {
      this.router.navigateByUrl('/home');
    });
  }

  resetPassword(email: string) {
    sendPasswordResetEmail(this.fbAuth, email).then(() => {
      this.displayResetAlert();
    });
  }

  signInWithGoogle() {
    signInWithPopup(this.fbAuth, new GoogleAuthProvider()).then(() => {
      this.router.navigateByUrl('/home');
    });
  }

  logout() {
    signOut(this.fbAuth);
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
