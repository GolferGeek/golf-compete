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
import {initialClubCombinations} from './data/initial-user.data'

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

  getClub(clubCombinationId: string): ClubCombinationModel {
    const clubCombination = this.clubCombinationsSubject.value.find((clubCombination) => clubCombination.id === clubCombinationId);
    return clubCombination as ClubCombinationModel;
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
    setDoc(docRef, {id: docRef.id}, {merge: true});
  }

  async deleteUserClubCombination(userId: string, clubCombinationId: string) {
    await deleteDoc(doc(this.firestore, `users/${userId}/clubCombinations/${clubCombinationId}`));
  }


  async updateUserClubCombination(userId: string, clubCombination: ClubCombinationModel) {
    await setDoc(doc(this.firestore, `users/${userId}/clubCombinations/${clubCombination.id}`), clubCombination);
  }

}
