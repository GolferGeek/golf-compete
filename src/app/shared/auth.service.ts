import { Injectable } from '@angular/core';
import {
  getAuth,
  GoogleAuthProvider, sendPasswordResetEmail, signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from '@angular/fire/auth';
import {
  getFirestore,
  doc,
  docData,
  setDoc,
} from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { UserModel } from '../models/user.model';
import { firstValueFrom } from 'rxjs';
import {Router} from '@angular/router'
import {AlertController} from '@ionic/angular'
@Injectable({ providedIn: 'root' })
export class AuthService {
  loggedIn = false;
  fbAuth = getAuth();
  firestore = getFirestore();
  private currentUserSubject = new BehaviorSubject<UserModel | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private router: Router, private alertController: AlertController) {
    this.fbAuth.onAuthStateChanged((user) => {
      if (user) {
        this.loggedIn = true;
        this.getUserInfo(user);
      } else {
        this.loggedIn = false;
        this.currentUserSubject.next(null);
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

  async getUserInfo(fbUser: User) {
    const userDocRef = doc(this.firestore, `users/${fbUser.uid}`);
    const foundUser = await firstValueFrom(docData(userDocRef, { idField: 'id' }));
      if (foundUser as UserModel) {
        this.currentUserSubject.next({
          email: foundUser!['email'] || '',
          userName: foundUser!['userName'] || foundUser!['email'] || '',
          id: foundUser!['id'],
          picture: foundUser!['photoURL'] || '',
          isAdministrator: false,
          handicap: foundUser!['handicap'] || 0,
          favoriteCourses: foundUser!['favoriteCourses'] || [],
          clubs: foundUser!['clubs'] || [],
          clubCombinations: foundUser!['clubCombinations'] || [],
        });
      } else {
        const newUser = {
          email: fbUser.email || '',
          userName: fbUser.displayName || fbUser.email || '',
          id: fbUser.uid,
          picture: fbUser.photoURL || '',
          isAdministrator: false,
          handicap: 0,
          favoriteCourses: [],
          clubs: [],
          clubCombinations: [],
        };
        this.currentUserSubject.next(newUser);
        setDoc(doc(this.firestore, 'users', newUser.id), newUser);
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
