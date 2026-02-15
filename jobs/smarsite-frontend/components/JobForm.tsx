"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { Job, Resource, Task } from "@/lib/types";
import { Save, ArrowLeft, X, Check, Plus, UserPlus, Wrench } from "lucide-react";
import Link from "next/link";
import { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const statusOptions = ["Planning", "In Progress", "Completed", "On Hold"];

interface JobFormProps {
  mode: "create" | "edit";
  initialData?: Job;
}

interface FormErrors {
  title?: string;
  taskId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  dateRange?: string;
}

export default function JobForm({ mode, initialData }: JobFormProps) {
  const router = useRouter();
  const { data: tasks = [] } = useSWR<Task[]>("/api/tasks", fetcher);
  const { data: humans = [] } = useSWR<Resource[]>(
    "/api/resources?type=Human",
    fetcher
  );
  const { data: equipment = [] } = useSWR<Resource[]>(
    "/api/resources?type=Equipment",
    fetcher
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskId, setTaskId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("Planning");
  const [selectedHumans, setSelectedHumans] = useState<number[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [humanDropdownOpen, setHumanDropdownOpen] = useState(false);
  const [equipmentDropdownOpen, setEquipmentDropdownOpen] = useState(false);

  // Inline resource creation state
  const [showAddHuman, setShowAddHuman] = useState(false);
  const [newHumanName, setNewHumanName] = useState("");
  const [newHumanRole, setNewHumanRole] = useState("");
  const [addingHuman, setAddingHuman] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [newEquipmentName, setNewEquipmentName] = useState("");
  const [newEquipmentType, setNewEquipmentType] = useState("");
  const [addingEquipment, setAddingEquipment] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setTaskId(initialData.taskId);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
      setStatus(initialData.status);
      setSelectedHumans(initialData.assignedHumans || []);
      setSelectedEquipment(initialData.assignedEquipment || []);
    }
  }, [initialData]);

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!title.trim()) newErrors.title = "Job title is required";
    if (!taskId) newErrors.taskId = "Please select a task";
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";
    if (!status) newErrors.status = "Status is required";

    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.dateRange = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const payload = {
      title,
      description,
      taskId: Number(taskId),
      startDate,
      endDate,
      status,
      assignedHumans: selectedHumans,
      assignedEquipment: selectedEquipment,
    };

    try {
      const url =
        mode === "create"
          ? "/api/jobs"
          : `/api/jobs/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/jobs");
      } else {
        const data = await res.json();
        setErrors({ title: data.error || "Something went wrong" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleHuman(id: number) {
    setSelectedHumans((prev) =>
      prev.includes(id) ? prev.filter((h) => h !== id) : [...prev, id]
    );
  }

  function toggleEquipment(id: number) {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  async function handleAddHuman() {
    if (!newHumanName.trim()) return;
    setAddingHuman(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHumanName.trim(),
          type: "Human",
          role: newHumanRole.trim() || undefined,
        }),
      });
      if (res.ok) {
        const newResource = await res.json();
        await mutate("/api/resources?type=Human");
        setSelectedHumans((prev) => [...prev, newResource.id]);
        setNewHumanName("");
        setNewHumanRole("");
        setShowAddHuman(false);
      }
    } finally {
      setAddingHuman(false);
    }
  }

  async function handleAddEquipment() {
    if (!newEquipmentName.trim()) return;
    setAddingEquipment(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEquipmentName.trim(),
          type: "Equipment",
        }),
      });
      if (res.ok) {
        const newResource = await res.json();
        await mutate("/api/resources?type=Equipment");
        setSelectedEquipment((prev) => [...prev, newResource.id]);
        setNewEquipmentName("");
        setNewEquipmentType("");
        setShowAddEquipment(false);
      }
    } finally {
      setAddingEquipment(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
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

          {/* Task Select */}
          <div>
            <label
              htmlFor="taskId"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Task <span className="text-destructive">*</span>
            </label>
            <select
              id="taskId"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value ? Number(e.target.value) : "")}
              className={`w-full px-4 py-2.5 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 transition-shadow ${
                errors.taskId
                  ? "border-destructive focus:ring-destructive/50"
                  : "border-border focus:ring-ring"
              }`}
            >
              <option value="">Select a task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.project})
                </option>
              ))}
            </select>
            {errors.taskId && (
              <p className="mt-1.5 text-sm text-destructive">{errors.taskId}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-semibold text-foreground mb-1.5"
              >
                Start Date <span className="text-destructive">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 transition-shadow ${
                  errors.startDate || errors.dateRange
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border focus:ring-ring"
                }`}
              />
              {errors.startDate && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.startDate}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-semibold text-foreground mb-1.5"
              >
                End Date <span className="text-destructive">*</span>
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border bg-input text-foreground focus:outline-none focus:ring-2 transition-shadow ${
                  errors.endDate || errors.dateRange
                    ? "border-destructive focus:ring-destructive/50"
                    : "border-border focus:ring-ring"
                }`}
              />
              {errors.endDate && (
                <p className="mt-1.5 text-sm text-destructive">
                  {errors.endDate}
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
              onChange={(e) => setStatus(e.target.value)}
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

          {/* Multi-select Assigned Humans */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Assigned Humans
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setHumanDropdownOpen(!humanDropdownOpen);
                  setEquipmentDropdownOpen(false);
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground text-left focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              >
                {selectedHumans.length === 0 ? (
                  <span className="text-muted-foreground">
                    Select team members
                  </span>
                ) : (
                  <span>{selectedHumans.length} selected</span>
                )}
              </button>

              {humanDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {humans.map((human) => (
                    <button
                      key={human.id}
                      type="button"
                      onClick={() => toggleHuman(human.id)}
                      className="w-full px-4 py-2.5 text-left hover:bg-secondary/50 flex items-center gap-3 text-sm transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          selectedHumans.includes(human.id)
                            ? "bg-primary border-primary"
                            : "border-border"
                        }`}
                      >
                        {selectedHumans.includes(human.id) && (
                          <Check size={12} className="text-primary-foreground" />
                        )}
                      </div>
                      <span className="text-foreground">{human.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Tags */}
            {selectedHumans.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedHumans.map((id) => {
                  const h = humans.find((r) => r.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {h?.name}
                      <button
                        type="button"
                        onClick={() => toggleHuman(id)}
                        className="hover:text-destructive"
                        aria-label={`Remove ${h?.name}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Add New Human Inline */}
            {!showAddHuman ? (
              <button
                type="button"
                onClick={() => setShowAddHuman(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <UserPlus size={14} />
                Add New Human
              </button>
            ) : (
              <div className="mt-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-3">
                  <UserPlus size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">New Team Member</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newHumanName}
                    onChange={(e) => setNewHumanName(e.target.value)}
                    placeholder="Name *"
                    className="px-3 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={newHumanRole}
                    onChange={(e) => setNewHumanRole(e.target.value)}
                    placeholder="Role (optional)"
                    className="px-3 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleAddHuman}
                    disabled={addingHuman || !newHumanName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    {addingHuman ? "Adding..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddHuman(false);
                      setNewHumanName("");
                      setNewHumanRole("");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Multi-select Assigned Equipment */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">
              Assigned Equipment
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setEquipmentDropdownOpen(!equipmentDropdownOpen);
                  setHumanDropdownOpen(false);
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-input text-foreground text-left focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              >
                {selectedEquipment.length === 0 ? (
                  <span className="text-muted-foreground">
                    Select equipment
                  </span>
                ) : (
                  <span>{selectedEquipment.length} selected</span>
                )}
              </button>

              {equipmentDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {equipment.map((equip) => (
                    <button
                      key={equip.id}
                      type="button"
                      onClick={() => toggleEquipment(equip.id)}
                      className="w-full px-4 py-2.5 text-left hover:bg-secondary/50 flex items-center gap-3 text-sm transition-colors"
                    >
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          selectedEquipment.includes(equip.id)
                            ? "bg-accent border-accent"
                            : "border-border"
                        }`}
                      >
                        {selectedEquipment.includes(equip.id) && (
                          <Check size={12} className="text-accent-foreground" />
                        )}
                      </div>
                      <span className="text-foreground">{equip.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Tags */}
            {selectedEquipment.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedEquipment.map((id) => {
                  const eq = equipment.find((r) => r.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent"
                    >
                      {eq?.name}
                      <button
                        type="button"
                        onClick={() => toggleEquipment(id)}
                        className="hover:text-destructive"
                        aria-label={`Remove ${eq?.name}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Add New Equipment Inline */}
            {!showAddEquipment ? (
              <button
                type="button"
                onClick={() => setShowAddEquipment(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <Wrench size={14} />
                Add New Equipment
              </button>
            ) : (
              <div className="mt-3 p-4 rounded-lg border border-accent/20 bg-accent/5">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench size={16} className="text-accent" />
                  <span className="text-sm font-semibold text-foreground">New Equipment</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newEquipmentName}
                    onChange={(e) => setNewEquipmentName(e.target.value)}
                    placeholder="Equipment name *"
                    className="px-3 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    value={newEquipmentType}
                    onChange={(e) => setNewEquipmentType(e.target.value)}
                    placeholder="Type (optional)"
                    className="px-3 py-2 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleAddEquipment}
                    disabled={addingEquipment || !newEquipmentName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    {addingEquipment ? "Adding..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddEquipment(false);
                      setNewEquipmentName("");
                      setNewEquipmentType("");
                    }}
                    className="px-3 py-1.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold hover:bg-accent/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save size={18} />
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Create Job"
                : "Update Job"}
          </button>
          <Link
            href="/jobs"
            className="px-6 py-2.5 rounded-lg border border-border text-foreground font-medium hover:bg-secondary transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Cancel
          </Link>
        </div>
      </div>
    </form>
  );
}
