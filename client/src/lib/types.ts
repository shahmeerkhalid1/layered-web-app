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
  /** When false, hidden from Exercise Library until promoted. */
  savedToLibrary?: boolean;
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
    description?: string | null;
    layers?: Pick<ExerciseLayer, "id" | "order" | "content" | "isFinisher">[];
    /** When false, exercise was created for a class plan and is not in the library list yet. */
    savedToLibrary?: boolean;
    orientation?: string | null;
    directionFaced?: string | null;
    movementType?: string | null;
    springs?: string | null;
    machineSetup?: string | null;
    equipment?: string[];
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

// ─── Scheduling / Calendar ───────────────────────────────────────────────────

export type ScheduledClassType = "GROUP" | "PRIVATE";

export type InstanceStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface ScheduledClass {
  id: string;
  title: string;
  type: ScheduledClassType;
  isRecurring: boolean;
  recurrenceRule?: unknown;
  startDate: string;
  endDate?: string | null;
  time: string;
  durationMinutes: number;
  templateId?: string | null;
  syncWithTemplate: boolean;
  instructorId: string;
  createdAt: string;
  deletedAt?: string | null;
  _count?: { instances: number };
  instances?: ClassInstanceSummary[];
}

export interface ClassInstanceSummary {
  id: string;
  classId: string;
  date: string;
  time: string;
  status: InstanceStatus;
  instructorId: string;
  templateId?: string | null;
  isCustomised: boolean;
  classType?: string | null;
  classStyle?: string | null;
  createdAt: string;
  deletedAt?: string | null;
}

/** Row from GET /api/class-instances?start&end */
export interface CalendarClassInstance {
  id: string;
  classId: string;
  date: string;
  time: string;
  status: InstanceStatus;
  instructorId: string;
  templateId?: string | null;
  isCustomised: boolean;
  classType?: string | null;
  classStyle?: string | null;
  class: {
    id: string;
    title: string;
    type: ScheduledClassType;
    durationMinutes: number;
  };
  _count: { sections: number };
}

export interface ClassInstanceDetail {
  id: string;
  classId: string;
  date: string;
  time: string;
  status: InstanceStatus;
  instructorId: string;
  templateId?: string | null;
  isCustomised: boolean;
  classType?: string | null;
  classStyle?: string | null;
  createdAt: string;
  deletedAt?: string | null;
  class: ScheduledClass;
  template?: { id: string; name: string } | null;
  sections: PlanSectionDetail[];
}

export interface ClassListResponse {
  data: ScheduledClass[];
  total: number;
  page: number;
  limit: number;
}

export interface QuickScheduleResponse {
  class: ScheduledClass;
  instance: ClassInstanceDetail;
}

export interface RecurrenceRuleInput {
  daysOfWeek: number[];
}

export interface CreateClassBody {
  title: string;
  type: ScheduledClassType;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRuleInput | null;
  startDate: string;
  endDate?: string | null;
  time: string;
  durationMinutes: number;
  templateId?: string | null;
}

export interface UpdateClassBody {
  title?: string;
  type?: ScheduledClassType;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRuleInput | null;
  startDate?: string;
  endDate?: string | null;
  time?: string;
  durationMinutes?: number;
  templateId?: string | null;
  regenerateFutureInstancesFrom?: string;
  rescheduleToDate?: string;
}

// ─── Clients / Roster ────────────────────────────────────────────────────────

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  injuries?: string | null;
  focusAreas?: string | null;
  goals?: string | null;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { enrollments: number; attendances: number };
}

export interface ClientDetail extends Client {
  enrollments: {
    id: string;
    classId: string;
    enrolledAt: string;
    canUnenroll: boolean;
    class: {
      id: string;
      title: string;
      type: ScheduledClassType;
      durationMinutes: number;
    };
  }[];
}

export interface ClientListResponse {
  data: Client[];
  total: number;
  page: number;
  limit: number;
}

export interface EnrollmentRow {
  id: string;
  clientId: string;
  classId: string;
  enrolledAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
  };
}

export interface EnrollClientsResponse {
  enrollments: EnrollmentRow[];
  created: number;
  skipped: number;
}

export interface UnenrollClientsResponse {
  removed: number;
  message: string;
}

export interface DeleteClientsResponse {
  removed: number;
  message: string;
}

export interface AttendanceRow {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  present: boolean | null;
}

// ─── Session Notes ───────────────────────────────────────────────────────────

export interface SessionNoteExerciseRow {
  id: string;
  exerciseId: string;
  exercise: { id: string; name: string };
}

export interface SessionNote {
  id: string;
  classInstanceId: string;
  clientId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  client: { id: string; firstName: string; lastName: string; email: string };
  exercises: SessionNoteExerciseRow[];
}

export interface SessionNoteTimelineItem {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  classInstance: {
    id: string;
    date: string;
    time: string;
    status: InstanceStatus;
    class: {
      id: string;
      title: string;
      type: ScheduledClassType;
      durationMinutes: number;
    };
  };
  exercises: SessionNoteExerciseRow[];
}

export interface SessionNoteTimelineResponse {
  data: SessionNoteTimelineItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  todayClasses: number;
  totalExercises: number;
  totalTemplates: number;
  totalClients: number;
}

export interface DashboardNotificationItem {
  instanceId: string;
  classTitle: string;
  date: string;
  time: string;
  classType: ScheduledClassType;
  clientName?: string;
}

export interface DashboardNotificationsResponse {
  noPlan: DashboardNotificationItem[];
  /** Past SCHEDULED instances that still need mark complete or cancel. */
  needsClosure: DashboardNotificationItem[];
  missingNotes: DashboardNotificationItem[];
  upcoming: DashboardNotificationItem[];
}
