import { HoleModel } from './hole.model';

export interface SideModel {
  id: string;
  name: string;
  holes: HoleModel[];
}
