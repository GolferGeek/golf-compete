export interface HoleDistanceModel {
  holeId: string;
  distance: number;
}
export interface TeeboxModel {
  id: string;
  name: string;
  totalYards: number;
  womansSlope: number;
  womansRating: number;
  mensSlope: number;
  mensRating: number;
  holeDistances: HoleDistanceModel[];
}
