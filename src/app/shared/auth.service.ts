import {Injectable} from '@angular/core';
import {
  getAuth,
  GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword,
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
    this.fbAuth.onAuthStateChanged(async (fbUser) => {
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
    }).catch(async (error) => {
      let message = '';
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Invalid email';
          break;
        case 'auth/user-disabled':
          message = 'User disabled';
          break;
        case 'auth/user-not-found':
          message = 'User not found';
          break;
        case 'auth/wrong-password':
          message = 'Wrong password';
          break;
        default:
          message = 'Unknown error';
      }
      const alert = await this.alertController.create({
        message: message,
        buttons: [
          {
            text: 'Ok',
            role: 'cancel',
          }
        ],
      });
      await alert.present();
    });
  }

  async register(email: string, password: string) {
    createUserWithEmailAndPassword(this.fbAuth, email, password).then(() => {
      this.router.navigateByUrl('/home');
    }).catch(async (error) => {
      let message = '';
      switch (error.code) {
        case 'auth/email-already-in-use':
          message = 'Email already in use';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email';
          break;
        case 'auth/operation-not-allowed':
          message = 'Operation not allowed';
          break;
        case 'auth/weak-password':
          message = 'Password too weak';
          break;
        default:
          message = 'Unknown error';
      }
      const alert = await this.alertController.create({
        message: message,
        buttons: [
          {
            text: 'Ok',
            role: 'cancel',
          }
        ],
      });
      await alert.present();
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
