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
  difficulty: Difficulty;
  notes?: string;
}

export enum Difficulty {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  HARD = "HARD",
  DIDNT_GET = "DIDNT_GET",
}

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
