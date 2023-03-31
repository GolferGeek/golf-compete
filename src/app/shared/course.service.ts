import {Injectable} from '@angular/core';
import {
  getFirestore,
  getDoc,
  doc,
  addDoc,
  collection,
  setDoc,
  deleteDoc,
  where,
  query,
  getDocs
} from '@angular/fire/firestore'
import {CourseModel} from '../models/course/course.model'

@Injectable({providedIn: 'root'})
export class CourseService {

  private firestore = getFirestore();

  constructor() {
  }

  async getCourses(state: string) {
    const coursesQuery = query(collection(this.firestore, `courses`), where('state', '==', state));
    const coursesSnapshot = (await getDocs(coursesQuery));
    const courses = [] as CourseModel[];
    coursesSnapshot.forEach((doc) => {
      courses.push(doc.data() as CourseModel);
    });
    return courses;
  }

  async getCourse(id: string): Promise<CourseModel> {
    const courseDoc = await getDoc(doc(this.firestore, 'courses', id));
    return courseDoc.data() as CourseModel;
  }

  async addCourse(course: Partial<CourseModel>) {
    const docRef = await addDoc(collection(this.firestore, `courses`), course);
    setDoc(docRef, {id: docRef.id}, {merge: true});
  }

  async deleteCourse(courseId: string) {
    await deleteDoc(doc(this.firestore, `courses/${courseId}`));
  }

  async updateCourse(course: CourseModel) {
    await setDoc(doc(this.firestore, `courses/${course.id}`), course);
  }
}
