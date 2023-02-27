import { ClubModel } from "./club.model";
import { CourseModel } from "./course/course.model";


export interface UserModel {
  email: string;
  userName: string;
  id: string;
  picture: string;
  isAdministrator: boolean;
  handicap: number;
  favoriteCourses: CourseModel[];
  currentClubs: ClubModel[];
  currentClubCombinations: ClubModel[];
}
