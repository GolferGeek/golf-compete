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
import {RoutineModel} from '../models/routine.model'
import {User} from '@angular/fire/auth'
import {initialRoutines} from './data/initial-user.data'

@Injectable({providedIn: 'root'})
export class UserRoutineService {
  firestore = getFirestore();

  routinesSubject = new BehaviorSubject<RoutineModel[]>([]);
  routines$ = this.routinesSubject.asObservable();

  constructor() {
  }

  setInitialRoutines(userId: string) {
    initialRoutines.forEach(async (routine) => {
      this.addUserRoutine(userId, routine);
    });
  }

  clearRoutines() {
    this.routinesSubject.next([]);
  }

  async addUserRoutine(userId: string, routine: Partial<RoutineModel>) {
    const routineInfo = {
      name: routine.name,
      description: routine.description,
      type: routine.type,
      current: routine.current
    };
    const docRef = await addDoc(collection(this.firestore, `users/${userId}/routines`), routineInfo);
    setDoc(docRef, {id: docRef.id}, {merge: true});
  }


  getRoutine(routineId: string): RoutineModel {
    const routine = this.routinesSubject.value.find((routine) => routine.id === routineId);
    return routine as RoutineModel;
  }

  async deleteUserRoutine(userId: string, routineId: string) {
    await deleteDoc(doc(this.firestore, `users/${userId}/routines/${routineId}`));
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

  async updateUserRoutine(userId: string, routine: RoutineModel) {
    await setDoc(doc(this.firestore, `users/${userId}/routines/${routine.id}`), routine);
  }

}
