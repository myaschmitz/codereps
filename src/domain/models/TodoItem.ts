// Domain model for a to-do item (problem to attempt)
export interface TodoItem {
  id: string;
  name: string; // Required: problem name
  number?: number; // Optional: LeetCode problem number
  note?: string; // Optional: context note (separate from review notes)
  completed: boolean;
  createdAt: Date;
  completedAt?: Date; // When marked complete
}

// Factory function to create a new to-do item
export function createTodoItem(
  name: string,
  number?: number,
  note?: string,
): TodoItem {
  return {
    id: crypto.randomUUID(),
    name,
    ...(number !== undefined && { number }),
    ...(note && { note }),
    completed: false,
    createdAt: new Date(),
  };
}
