// ─── Exercise Library ────────────────────────────────────────────────────────

export interface ExerciseImage {
  id: string;
  exerciseId: string;
  url: string;
  publicId?: string;
  order: number;
}

export interface ExerciseLayer {
  id: string;
  exerciseId: string;
  order: number;
  content: string;
  isFinisher?: boolean;
}

export interface ExerciseFolder {
  id: string;
  name: string;
  _count?: { exercises: number };
}

export interface ExerciseFoldersResponse {
  folders: ExerciseFolder[];
  totalExercises: number;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string | null;
  startingPosition?: string | null;
  orientation?: string | null;
  directionFaced?: string | null;
  movementType?: string | null;
  springs?: string | null;
  equipment?: string[];
  machineSetup?: string | null;
  transitionCues?: string | null;
  cueing?: string | null;
  spinalMovement?: string[];
  chainType?: string[];
  jointLoading?: string[];
  progressionNotes?: string | null;
  regressionNotes?: string | null;
  tags: string[];
  folderId?: string | null;
  instructorId: string;
  progressionOfId?: string | null;
  createdAt: string;
  updatedAt: string;
  images: ExerciseImage[];
  layers: ExerciseLayer[];
  folder?: ExerciseFolder | null;
  progressionOf?: { id: string; name: string } | null;
  progressions?: { id: string; name: string }[];
}

export interface ProgressionChainItem {
  id: string;
  name: string;
  level: number;
}

/** Row from GET /dropdowns/:categoryKey */
export interface DropdownOptionRow {
  id: string;
  label: string;
  value: string;
  order: number;
}

// ─── Class Plan Templates ────────────────────────────────────────────────────

export interface ClassPlanFolder {
  id: string;
  name: string;
  _count?: { templates: number };
}

export interface ClassPlanFoldersResponse {
  folders: ClassPlanFolder[];
  totalTemplates: number;
}

/** Section row from POST/PATCH /api/class-plans/:id/sections */
export interface PlanSection {
  id: string;
  name: string;
  order: number;
  templateId: string | null;
  createdAt: string;
}

/** Slot + exercise summary on GET /api/class-plans/:id */
export interface PlanSectionExerciseRow {
  id: string;
  exerciseId: string;
  order: number;
  reps?: string | null;
  duration?: string | null;
  notes?: string | null;
  exercise: {
    id: string;
    name: string;
    spinalMovement?: string[];
    chainType?: string[];
    jointLoading?: string[];
  };
}

/** Section with exercises from GET /api/class-plans/:id */
export interface PlanSectionDetail extends PlanSection {
  exercises: PlanSectionExerciseRow[];
}

/** Full template from GET /api/class-plans/:id */
export interface ClassPlanTemplateDetail extends ClassPlanTemplate {
  sections: PlanSectionDetail[];
}

/** List row from GET /api/class-plans (includes section count) */
export interface ClassPlanTemplate {
  id: string;
  name: string;
  classType?: string | null;
  classStyle?: string | null;
  durationMinutes?: number | null;
  folderId?: string | null;
  tags: string[];
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  folder?: { id: string; name: string } | null;
  _count?: { sections: number };
}

export interface ClassPlanListResponse {
  data: ClassPlanTemplate[];
  total: number;
  page: number;
  limit: number;
}
