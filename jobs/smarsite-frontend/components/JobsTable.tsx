"use client";

import Link from "next/link";
import type { Job, Resource } from "@/lib/types";
import { Pencil, Trash2, Briefcase, Calendar, Users, Wrench } from "lucide-react";

interface JobsTableProps {
  jobs: Job[];
  resources: Resource[];
  onDelete: (job: Job) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-800";
    case "In Progress":
      return "bg-blue-100 text-blue-800";
    case "Planning":
      return "bg-yellow-100 text-yellow-800";
    case "On Hold":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getResourceNames(ids: number[], resources: Resource[]) {
  if (!ids || ids.length === 0) return "None";
  return ids
    .map((id) => resources.find((r) => r.id === id)?.name)
    .filter(Boolean)
    .join(", ");
}

export default function JobsTable({ jobs, resources, onDelete }: JobsTableProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary border-b border-border">
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Job Title
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Task
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Start Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                End Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Assigned Humans
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Assigned Equipment
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Briefcase size={32} className="text-muted-foreground/40" />
                    <p className="text-lg font-medium">No jobs found</p>
                    <p className="text-sm">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  className="border-b border-border hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} className="text-accent flex-shrink-0" />
                      <span className="font-semibold text-foreground">
                        {job.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {job.taskName}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Calendar size={14} className="text-primary flex-shrink-0" />
                      {new Date(job.startDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Calendar size={14} className="text-primary flex-shrink-0" />
                      {new Date(job.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-foreground max-w-[200px]">
                      <Users size={14} className="text-primary flex-shrink-0" />
                      <span className="truncate">
                        {getResourceNames(job.assignedHumans, resources)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-foreground max-w-[200px]">
                      <Wrench size={14} className="text-accent flex-shrink-0" />
                      <span className="truncate">
                        {getResourceNames(job.assignedEquipment, resources)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/jobs/${job.id}/edit`}
                        className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                        aria-label={`Edit ${job.title}`}
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => onDelete(job)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        aria-label={`Delete ${job.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
