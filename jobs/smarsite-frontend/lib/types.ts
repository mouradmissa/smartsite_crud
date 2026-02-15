// ---------- MongoDB-backed types (matching NestJS schema) ----------

export interface AssignedResource {
  resourceId: string;
  type: "Human" | "Equipment";
}

export interface Job {
  _id: string;
  taskId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: "Planifié" | "En cours" | "Terminé";
  assignedResources: AssignedResource[];
  createdAt: string;
  updatedAt: string;
}

export type CreateJobPayload = Omit<Job, "_id" | "createdAt" | "updatedAt">;
export type UpdateJobPayload = Partial<CreateJobPayload>;

// ---------- Auxiliary types (kept for resources/tasks pages) ----------

export interface Resource {
  id: number;
  name: string;
  type: "Human" | "Equipment";
}

export interface Task {
  id: number;
  title: string;
  project: string;
}

// ---------- API error type ----------

export class ApiError extends Error {
  status: number;
  info: unknown;

  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.status = status;
    this.info = info;
  }
}
