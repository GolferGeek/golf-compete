import {Injectable} from '@angular/core';
import {UserModel} from '../models/user.model'
import {BehaviorSubject, firstValueFrom} from 'rxjs'
import {getAuth, User} from '@angular/fire/auth'
import {
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
} from '@angular/fire/firestore'
import firebase from 'firebase/compat'
import {UserClubService} from './user-club.service'
import {UserClubCombinationService} from './user-club-combination.service'
import {UserRoutineService} from './user-routine.service'

@Injectable({providedIn: 'root'})
export class UserService {

  private fbAuth = getAuth();
  private firestore = getFirestore();

  userSubject = new BehaviorSubject<UserModel | null>(null);
  user$ = this.userSubject.asObservable();


  constructor(
    private userClubService: UserClubService,
    private userClubCombinationService: UserClubCombinationService,
    private userRoutineService: UserRoutineService

  ) {
    this.fbAuth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        await this.getUser(fbUser);
        await this.userClubService.getClubs(fbUser.uid);
        await this.userClubCombinationService.getClubCombinations(fbUser.uid);
        await this.userRoutineService.getRoutines(fbUser);
      } else {
        this.userSubject.next(null);
        this.userClubService.clearClubs()
        this.userClubCombinationService.clearClubCombinations();
        this.userRoutineService.clearRoutines();
      }
    });
  }

  async getUser(fbUser: User) {
    onSnapshot(doc(this.firestore, `users/${fbUser.uid}`), async doc => {
      const foundUser = doc.data() as unknown as UserModel;
      if (foundUser) {
        this.userSubject.next({
          email: foundUser!['email'] || '',
          userName: foundUser!['userName'] || foundUser!['email'] || '',
          picture: foundUser!['picture'] || '',
          handicap: foundUser!['handicap'] || 0,
          favoriteCourses: foundUser!['favoriteCourses'] || [],
          id: foundUser!['id'],
          isAdministrator: foundUser!['isAdministrator'] || false,
        });
      } else {
        await this.addNewUser(fbUser);
      }
    });
  }

  async addNewUser(fbUser: User) {
    const newUser = {
      id: fbUser.uid,
      email: fbUser.email || '',
      userName: fbUser.displayName || fbUser.email || '',
      picture: fbUser.photoURL || '',
      handicap: 0,
      favoriteCourses: [],
      isAdministrator: false,
    };
    await setDoc(doc(this.firestore, 'users', newUser.id), newUser);
    this.userClubService.setInitialClubs(newUser.id)
    this.userClubCombinationService.setInitialClubCombinations(newUser.id)
    this.userRoutineService.setInitialRoutines(newUser.id)
  }
}
