import { CourseModel } from "./course/course.model";


export interface UserModel {
  id: string;
  email: string;
  userName: string;
  picture: string;
  handicap: number;
  favoriteCourses: CourseModel[];
  isAdministrator: boolean;
}
