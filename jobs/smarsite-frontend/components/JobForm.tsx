"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { mutate } from "swr";
import type { Job, CreateJobPayload } from "@/lib/types";
import { createJob, updateJob, getJobsKey } from "@/lib/api";
import { Save, ArrowLeft, X, Plus } from "lucide-react";
import Link from "next/link";

const statusOptions: Job["status"][] = ["Planifié", "En cours", "Terminé"];

interface JobFormProps {
  mode: "create" | "edit";
  initialData?: Job;
}

interface FormErrors {
  title?: string;
  taskId?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  dateRange?: string;
  general?: string;
}

export default function JobForm({ mode, initialData }: JobFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskId, setTaskId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [status, setStatus] = useState<Job["status"]>("Planifié");
  const [assignedResources, setAssignedResources] = useState<
    { resourceId: string; type: "Human" | "Equipment" }[]
  >([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New resource inline fields
  const [newResourceId, setNewResourceId] = useState("");
  const [newResourceType, setNewResourceType] = useState<"Human" | "Equipment">("Human");

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description ?? "");
      setTaskId(initialData.taskId);
      setStartTime(initialData.startTime ? initialData.startTime.slice(0, 16) : "");
      setEndTime(initialData.endTime ? initialData.endTime.slice(0, 16) : "");
      setStatus(initialData.status);
      setAssignedResources(initialData.assignedResources ?? []);
    }
  }, [initialData]);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!title.trim()) newErrors.title = "Job title is required";
    if (!taskId.trim()) newErrors.taskId = "Task ID is required";
    if (!startTime) newErrors.startTime = "Start time is required";
    if (!endTime) newErrors.endTime = "End time is required";
    if (!status) newErrors.status = "Status is required";

    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      newErrors.dateRange = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const payload: CreateJobPayload = {
      title,
      description,
      taskId,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      status,
      assignedResources,
    };

    try {
      if (mode === "create") {
        await createJob(payload);
      } else {
        await updateJob(initialData!._id, payload);
      }
      // Revalidate the jobs list in SWR cache
      mutate(getJobsKey());
      router.push("/jobs");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  function addResource() {
    if (!newResourceId.trim()) return;
    setAssignedResources((prev) => [
      ...prev,
      { resourceId: newResourceId.trim(), type: newResourceType },
    ]);
    setNewResourceId("");
  }

  function removeResource(index: number) {
    setAssignedResources((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      {/* Back link */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Jobs
      </Link>

      <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
        {errors.general && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive font-medium">{errors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Job Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Job Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter job title"
              className={`w-full px-4 py-2.5 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow ${
                errors.title
                  ? "border-destructive focus:ring-destructive/50"
                  : "border-border focus:ring-ring"
              }`}
            />
            {errors.title && (
              <p className="mt-1.5 text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the job"
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
            />
          </div>

          {/* Task ID */}
          <div>
            <label
              htmlFor="taskId"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Task ID <span className="text-destructive">*</span>
            </label>
            <input
              id="taskId"
              type="text"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              placeholder="MongoDB ObjectId of the task"
              className={`w-full px-4 py-2.5 rounded-lg border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-shadow ${
                errors.taskId
                  ? "border-destructive focus:ring-destructive/50"
                  : "border-border focus:ring-ring"
              }`}
            />
            {errors.taskId && (
              <p className="mt-1.5 text-sm text-destructive">{errors.taskId}</p>
            )}
          </div>

          {/* Date/Times */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-semibold text-foreground mb-1.5"
              >
                Start Time <span className="text-destructive">*</span>
              </label>
              <input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 transition-shadow ${
                  errors.startTime || errors.dateRange
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border focus:ring-ring"
                }`}
              />
              {errors.startTime && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.startTime}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-semibold text-foreground mb-1.5"
              >
                End Time <span className="text-destructive">*</span>
              </label>
              <input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 transition-shadow ${
                  errors.endTime || errors.dateRange
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border focus:ring-ring"
                }`}
              />
              {errors.endTime && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>
          {errors.dateRange && (
            <p className="-mt-4 text-sm text-destructive">{errors.dateRange}</p>
          )}

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Status <span className="text-destructive">*</span>
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Job["status"])}
              className={`w-full px-4 py-2.5 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 transition-shadow ${
                errors.status
                  ? "border-destructive focus:ring-destructive/50"
                  : "border-border focus:ring-ring"
              }`}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1.5 text-sm text-destructive">{errors.status}</p>
            )}
          </div>

          {/* Assigned Resources */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Assigned Resources
            </label>

            {/* List existing */}
            {assignedResources.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {assignedResources.map((r, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    {r.type}: {r.resourceId.slice(-6)}
                    <button
                      type="button"
                      onClick={() => removeResource(idx)}
                      className="hover:text-destructive"
                      aria-label="Remove resource"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add new resource inline */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 p-4 rounded-lg border border-border bg-secondary/30">
              <div className="flex-1 w-full">
                <label htmlFor="newResourceId" className="block text-xs font-medium text-muted-foreground mb-1">
                  Resource ID
                </label>
                <input
                  id="newResourceId"
                  type="text"
                  value={newResourceId}
                  onChange={(e) => setNewResourceId(e.target.value)}
                  placeholder="MongoDB ObjectId"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="w-full sm:w-40">
                <label htmlFor="newResourceType" className="block text-xs font-medium text-muted-foreground mb-1">
                  Type
                </label>
                <select
                  id="newResourceType"
                  value={newResourceType}
                  onChange={(e) =>
                    setNewResourceType(e.target.value as "Human" | "Equipment")
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="Human">Human</option>
                  <option value="Equipment">Equipment</option>
                </select>
              </div>
              <button
                type="button"
                onClick={addResource}
                disabled={!newResourceId.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} />
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Job"
                : "Update Job"}
          </button>
          <Link
            href="/jobs"
            className="px-6 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
