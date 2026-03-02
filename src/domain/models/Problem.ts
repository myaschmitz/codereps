// Domain model for a LeetCode problem
export interface Problem {
  id: string;
  name: string;
  number?: number; // LeetCode problem number (optional)
  reviewHistory: ReviewRecord[];
  nextReviewDate: Date;
  createdAt: Date;
  archived: boolean;
}

export interface ReviewRecord {
  date: Date;
  priority: ReturnPriority;
  notes?: string;
}

// 1 = Don't Return (90 days) ... 5 = Return ASAP (2 days)
export type ReturnPriority = 1 | 2 | 3 | 4 | 5;

// Factory function to create a new problem
export function createProblem(name: string, number?: number): Problem {
  return {
    id: crypto.randomUUID(),
    name,
    number,
    reviewHistory: [],
    nextReviewDate: new Date(),
    createdAt: new Date(),
    archived: false,
  };
}
