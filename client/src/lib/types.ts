// ─── Exercise Library ────────────────────────────────────────────────────────

export interface ExerciseImage {
 id: string;
 exerciseId: string;
 url: string;
 publicId?: string;
 order: number;
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
 cueing?: string | null;
 tags: string[];
 folderId?: string | null;
 instructorId: string;
 progressionOfId?: string | null;
 createdAt: string;
 updatedAt: string;
 images: ExerciseImage[];
 folder?: ExerciseFolder | null;
 progressionOf?: { id: string; name: string } | null;
 progressions?: { id: string; name: string }[];
}

export interface ProgressionChainItem {
 id: string;
 name: string;
 level: number;
}
