export enum RoutineType {
  PreShot = 1,
  PostShot = 2,
  PreHole = 3,
  PostHole = 4,
  PreRound = 5,
  PostRound = 6,
}

export interface RoutineModel {
  id: string;
  name: string;
  description: string;
  type: RoutineType;
  current: boolean;
}
