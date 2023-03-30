import {Injectable} from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where
} from '@angular/fire/firestore'
import {BehaviorSubject} from 'rxjs'
import {ClubCombinationModel} from '../models/club-combination.model'
import {User} from '@angular/fire/auth'
import {initialClubCombinations} from './initial-user.data'

@Injectable({providedIn: 'root'})
export class UserClubCombinationService {

  firestore = getFirestore();

  clubCombinationsSubject = new BehaviorSubject<ClubCombinationModel[]>([]);
  clubCombinations$ = this.clubCombinationsSubject.asObservable();

  constructor() {
  }

  setInitialClubCombinations(userId: string) {
    initialClubCombinations.forEach(async (clubCombination) => {
      this.addUserClubCombination(userId, clubCombination);
    });
  }

  clearClubCombinations() {
    this.clubCombinationsSubject.next([]);
  }

  async getClubCombinations(userId: string) {
    // club subscription
    const userClubCombinationsQuery = query(collection(this.firestore, `users/${userId}/clubCombinations`), where('current', '==', true));
    onSnapshot(userClubCombinationsQuery, (querySnapshot) => {
      const clubCombinations: ClubCombinationModel[] = [];
      querySnapshot.forEach((doc) => {
        clubCombinations.push(doc.data() as ClubCombinationModel);
      });
      this.clubCombinationsSubject.next(clubCombinations);
    })
  }

  async addUserClubCombination(userId: string, clubCombination: Partial<ClubCombinationModel>) {
    const docRef = await addDoc(collection(this.firestore, `users/${userId}/clubCombinations`), clubCombination);
    setDoc(docRef, {id: docRef.id, ...clubCombination}, {merge: true});
  }

  async deleteUserClubCombination(userId: string, clubCombinationId: string) {
    await deleteDoc(doc(this.firestore, `users/${userId}/clubCombinations/${clubCombinationId}`));
  }

}
