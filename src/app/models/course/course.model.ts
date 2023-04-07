import { TeeboxModel } from './teebox.model';
import { SideModel } from './side.model';

export interface CourseModel {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  teeBoxes: TeeboxModel[];
  sides: SideModel[];
}
