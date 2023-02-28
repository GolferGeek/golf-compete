export interface TeeboxDistanceModel {
  teeboxId: string;
  distance: number;
}

export interface HoleModel {
  id: string;
  number: number;
  name: string;
  par: number;
  handicap: number;
  teeboxDistances: TeeboxDistanceModel[];
}
