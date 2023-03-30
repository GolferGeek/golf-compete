import {Injectable} from '@angular/core';
import {UserModel} from '../models/user.model'
import {BehaviorSubject, firstValueFrom} from 'rxjs'
import {ClubModel} from '../models/club.model'
import {ClubCombinationModel} from '../models/club-combination.model'
import {RoutineModel} from '../models/routine.model'
import {getAuth, User} from '@angular/fire/auth'
import {
  addDoc,
  collection, deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where
} from '@angular/fire/firestore'
import firebase from 'firebase/compat'
import Unsubscribe = firebase.Unsubscribe
import {initialClubCombinations, initialClubs, initialRoutines} from './initial-user.data'

@Injectable({providedIn: 'root'})
export class UserService {

  fbAuth = getAuth();
  firestore = getFirestore();

  userSubject = new BehaviorSubject<UserModel | null>(null);
  user$ = this.userSubject.asObservable();

  clubsSubject = new BehaviorSubject<ClubModel[]>([]);
  clubs$ = this.clubsSubject.asObservable();

  clubCombinationsSubject = new BehaviorSubject<ClubCombinationModel[]>([]);
  clubCombinations$ = this.clubCombinationsSubject.asObservable();

  routinesSubject = new BehaviorSubject<RoutineModel[]>([]);
  routines$ = this.routinesSubject.asObservable();

  constructor() {
    this.fbAuth.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        await this.getUser(fbUser);
        await this.getClubs(fbUser);
        await this.getClubCombinations(fbUser);
        await this.getRoutines(fbUser);
      } else {
        this.userSubject.next(null);
        this.clubsSubject.next([]);
        this.clubCombinationsSubject.next([]);
        this.routinesSubject.next([]);
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
    initialClubs.forEach((club) => {
      this.addUserClub(newUser.id, club);
    });
    initialClubCombinations.forEach((clubCombination) => {
      this.addUserClubCombination(newUser.id, clubCombination);
    });
    initialRoutines.forEach((routine) => {
      this.addUserRoutine(newUser.id, routine);
    });
  }

  getClub(clubId: string): ClubModel {
    const club = this.clubsSubject.value.find((club) => club.id === clubId);
    return club as ClubModel;
  }

  async addUserClub(userId: string, club: Partial<ClubModel>) {
    const docRef = await addDoc(collection(this.firestore, `users/${userId}/clubs`), club);
    setDoc(docRef, {id: docRef.id}, {merge: true});
  }

  async deleteUserClub(userId: string, clubId: string) {
    await deleteDoc(doc(this.firestore, `users/${userId}/clubs/${clubId}`));
  }

  async updateUserClub(userId: string, club: ClubModel) {
    await setDoc(doc(this.firestore, `users/${userId}/clubs/${club.id}`), club);
  }

  async addUserClubCombination(userId: string, clubCombination: Partial<ClubCombinationModel>) {
    const docRef = await addDoc(collection(this.firestore, `users/${userId}/clubCombinations`), clubCombination);
    setDoc(docRef, {id: docRef.id, ...clubCombination}, {merge: true});
  }

  async deleteUserClubCombination(userId: string, clubCombinationId: string) {
    await deleteDoc(doc(this.firestore, `users/${userId}/clubCombinations/${clubCombinationId}`));
  }

  async addUserRoutine(userId: string, routine: Partial<RoutineModel>) {
    const routineInfo = {
      name: routine.name,
      description: routine.description,
      type: routine.type,
      current: routine.current
    };
    const docRef = await addDoc(collection(this.firestore, `users/${userId}/routines`), routineInfo);
    setDoc(docRef, {id: docRef.id, ...routineInfo}, {merge: true});
  }

  async deleteUserRoutine(userId: string, routineId: string) {
    await deleteDoc(doc(this.firestore, `users/${userId}/routines/${routineId}`));
  }

  async getClubs(fbUser: User) {
    // club subscription
    const userClubsQuery = query(collection(this.firestore, `users/${fbUser.uid}/clubs`), where('current', '==', true), orderBy('maxDistance', 'desc'));
    onSnapshot(userClubsQuery, (querySnapshot) => {
      const clubs: ClubModel[] = [];
      querySnapshot.forEach((doc) => {
        clubs.push(doc.data() as ClubModel);
      });
      this.clubsSubject.next(clubs);
    })
  }

  async getClubCombinations(fbUser: User) {
    // club subscription
    const userClubCombinationsQuery = query(collection(this.firestore, `users/${fbUser.uid}/clubCombinations`), where('current', '==', true));
    onSnapshot(userClubCombinationsQuery, (querySnapshot) => {
      const clubCombinations: ClubCombinationModel[] = [];
      querySnapshot.forEach((doc) => {
        clubCombinations.push(doc.data() as ClubCombinationModel);
      });
      this.clubCombinationsSubject.next(clubCombinations);
    })
  }

  async getRoutines(fbUser: User) {
    // club subscription
    const userRoutinesQuery = query(collection(this.firestore, `users/${fbUser.uid}/routines`), where('current', '==', true));
    onSnapshot(userRoutinesQuery, (querySnapshot) => {
      const routines: RoutineModel[] = [];
      querySnapshot.forEach((doc) => {
        routines.push(doc.data() as RoutineModel);
      });
      this.routinesSubject.next(routines);
    })

  }

}
