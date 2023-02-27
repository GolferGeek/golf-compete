import { Injectable } from '@angular/core';
import {
  getAuth,
  GoogleAuthProvider,
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
@Injectable({ providedIn: 'root' })
export class AuthService {
  loggedIn = false;
  fbAuth = getAuth();
  firestore = getFirestore();
  private currentUserSubject = new BehaviorSubject<UserModel | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
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
  login() {
    signInWithPopup(this.fbAuth, new GoogleAuthProvider());
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
          currentClubs: foundUser!['currentClubs'] || [],
          currentClubCombinations: foundUser!['currentClubCombinations'] || [],
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
          currentClubs: [],
          currentClubCombinations: [],
        };
        this.currentUserSubject.next(newUser);
        setDoc(doc(this.firestore, 'users', newUser.id), newUser);
      }
  }
}
