import { ClubModel } from "./club.model";

export interface ClubCombinationModel {
  id: string;
  name: string;
  description: string;
  picture: string;
  clubs: ClubModel[];
  current: boolean;
}
