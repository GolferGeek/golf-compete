// Course form data type
export interface CourseFormData {
  name: string;
  city: string;
  state: string;
  holes: number;
  par: number;
  amenities: string;
  website: string;
  phoneNumber: string;
  isActive: boolean;
}

// Tee set type
export interface TeeSet {
  id: string;
  name: string;
  color: string;
  rating: number;
  slope: number;
  length?: number;
}

// Hole type
export interface Hole {
  id?: string;
  course_id?: string;
  number: number;
  par: number;
  handicap_index: number;
  notes?: string;
}

// Image extraction types
export type ExtractionStep = 'course' | 'teeBoxes' | 'scorecard' | null;

// Course info step props
export interface CourseInfoStepProps {
  formData: CourseFormData;
  setFormData: React.Dispatch<React.SetStateAction<CourseFormData>>;
  loading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isEditMode: boolean;
  processingImage?: boolean;
  setProcessingImage?: React.Dispatch<React.SetStateAction<boolean>>;
  extractionStep?: ExtractionStep;
  setExtractionStep?: React.Dispatch<React.SetStateAction<ExtractionStep>>;
  router?: any;
  courseId?: string;
  isMobile?: boolean;
}

// Tee boxes step props
export interface TeeBoxesStepProps {
  courseId: string;
  teeBoxes: TeeSet[];
  setTeeBoxes: React.Dispatch<React.SetStateAction<TeeSet[]>>;
  holes?: Hole[];
  setHoles?: React.Dispatch<React.SetStateAction<Hole[]>>;
  handleNext?: () => void;
  handleBack?: () => void;
  saveTeeBoxes?: () => Promise<boolean>;
  loading: boolean;
  processingImage: boolean;
  setProcessingImage: React.Dispatch<React.SetStateAction<boolean>>;
  extractionStep: ExtractionStep;
  setExtractionStep: React.Dispatch<React.SetStateAction<ExtractionStep>>;
  isMobile?: boolean;
}

// Scorecard step props
export interface ScorecardStepProps {
  courseId: string;
  teeBoxes: TeeSet[];
  holes: Hole[];
  setHoles: React.Dispatch<React.SetStateAction<Hole[]>>;
  handleSubmit?: (e: React.FormEvent) => Promise<void>;
  handleBack?: () => void;
  saveScorecard?: () => Promise<boolean>;
  loading: boolean;
  processingImage: boolean;
  setProcessingImage: React.Dispatch<React.SetStateAction<boolean>>;
  extractionStep: ExtractionStep;
  setExtractionStep: React.Dispatch<React.SetStateAction<ExtractionStep>>;
  isMobile?: boolean;
}

// Image uploader props
export interface ImageUploaderProps {
  step: 'course' | 'teeBoxes' | 'scorecard';
  processingImage: boolean;
  setProcessingImage: React.Dispatch<React.SetStateAction<boolean>>;
  extractionStep: ExtractionStep;
  setExtractionStep: React.Dispatch<React.SetStateAction<ExtractionStep>>;
  onDataExtracted: (data: any) => void;
  isMobile?: boolean;
}

// Tee box table props
export interface TeeBoxTableProps {
  teeBoxes: TeeSet[];
  onEdit: (teeBox: TeeSet) => void;
  onDelete: (id: string) => void;
  isMobile?: boolean;
}

// Scorecard grid props
export interface ScorecardGridProps {
  teeBoxes: TeeSet[];
  holes: Hole[];
  setHoles: React.Dispatch<React.SetStateAction<Hole[]>>;
  onSave: () => Promise<void>;
  isMobile?: boolean;
} 