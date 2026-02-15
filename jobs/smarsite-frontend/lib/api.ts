import type { Job, CreateJobPayload, UpdateJobPayload } from "./types";
import { ApiError } from "./types";

// ---------------------------------------------------------------------------
// Base URL – resolved at build/runtime from env, falls back to localhost:3200
// The Next.js rewrites in next.config.mjs proxy /api/backend/** → backend so
// in the browser we always call the Next.js host and avoid CORS entirely.
// ---------------------------------------------------------------------------
const API_BASE = "/api/backend";

// ---------------------------------------------------------------------------
// Generic fetcher (used by SWR and internal helpers)
// ---------------------------------------------------------------------------
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const info = await res.json().catch(() => null);
    throw new ApiError(
      info?.message ?? `Request failed with status ${res.status}`,
      res.status,
      info
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Jobs CRUD
// ---------------------------------------------------------------------------

/** GET /jobs – list all jobs */
export function getJobsKey() {
  return `${API_BASE}/jobs`;
}

/** GET /jobs/:id – single job */
export function getJobKey(id: string) {
  return `${API_BASE}/jobs/${id}`;
}

/** POST /jobs */
export async function createJob(payload: CreateJobPayload): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const info = await res.json().catch(() => null);
    throw new ApiError(
      info?.message ?? "Failed to create job",
      res.status,
      info
    );
  }

  return res.json();
}

/** PUT /jobs/:id */
export async function updateJob(
  id: string,
  payload: UpdateJobPayload
): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const info = await res.json().catch(() => null);
    throw new ApiError(
      info?.message ?? "Failed to update job",
      res.status,
      info
    );
  }

  return res.json();
}

/** DELETE /jobs/:id */
export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const info = await res.json().catch(() => null);
    throw new ApiError(
      info?.message ?? "Failed to delete job",
      res.status,
      info
    );
  }
}
