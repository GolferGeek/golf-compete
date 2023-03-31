import {Injectable} from '@angular/core';
import {ClubModel} from '../models/club.model'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where
} from '@angular/fire/firestore'
import {initialClubs} from './data/initial-user.data'
import {BehaviorSubject} from 'rxjs'

@Injectable({providedIn: 'root'})
export class UserClubService {

  firestore = getFirestore();

  clubsSubject = new BehaviorSubject<ClubModel[]>([]);
  clubs$ = this.clubsSubject.asObservable();


  constructor() {
  }

  setInitialClubs(userId: string) {
    initialClubs.forEach(async (club) => {
      this.addUserClub(userId, club)
    });
  }

  clearClubs() {
    this.clubsSubject.next([]);
  }

  async getClubs(userId: string) {
    // club subscription
    const userClubsQuery = query(collection(this.firestore, `users/${userId}/clubs`), where('current', '==', true), orderBy('maxDistance', 'desc'));
    onSnapshot(userClubsQuery, (querySnapshot) => {
      const clubs: ClubModel[] = [];
      querySnapshot.forEach((doc) => {
        clubs.push(doc.data() as ClubModel);
      });
      this.clubsSubject.next(clubs);
    })
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

}
