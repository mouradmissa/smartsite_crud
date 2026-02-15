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

export interface Job {
  id: number;
  title: string;
  description: string;
  taskId: number;
  taskName: string;
  startDate: string;
  endDate: string;
  status: "Planning" | "In Progress" | "Completed" | "On Hold";
  assignedHumans: number[];
  assignedEquipment: number[];
}
