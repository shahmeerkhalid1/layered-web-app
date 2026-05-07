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
}

export interface ExerciseFolder {
  id: string;
  name: string;
  _count?: { exercises: number };
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
  equipment?: string | null;
  machineSetup?: string | null;
  transitionCues?: string | null;
  cueing?: string | null;
  spinalMovement?: string | null;
  chainType?: string | null;
  jointLoading?: string | null;
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
