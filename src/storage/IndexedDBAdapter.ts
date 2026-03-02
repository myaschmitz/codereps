import Dexie, { Table } from "dexie";
import { Problem } from "../domain/models/Problem";
import { TodoItem } from "../domain/models/TodoItem";

/**
 * IndexedDBAdapter - DEEP MODULE
 *
 * Wraps Dexie/IndexedDB complexity.
 * Provides type-safe database access.
 */
class CodeRepsDatabase extends Dexie {
  problems!: Table<Problem>;
  todoItems!: Table<TodoItem>;

  constructor() {
    super("CodeReps");

    this.version(1).stores({
      problems: "id, name, nextReviewDate, archived, createdAt",
    });

    // Version 2: Add todoItems table for to-do list feature
    this.version(2).stores({
      problems: "id, name, nextReviewDate, archived, createdAt",
      todoItems: "id, name, completed, createdAt",
    });

    // Version 3: Migrate difficulty -> priority in reviewHistory
    this.version(3).stores({
      problems: "id, name, nextReviewDate, archived, createdAt",
      todoItems: "id, name, completed, createdAt",
    }).upgrade(async (tx) => {
      const difficultyMap: Record<string, number> = {
        EASY: 1,
        MEDIUM: 3,
        HARD: 5,
        DIDNT_GET: 5,
      };

      await tx.table("problems").toCollection().modify((problem: any) => {
        if (problem.reviewHistory) {
          problem.reviewHistory = problem.reviewHistory.map((r: any) => {
            if (r.difficulty !== undefined) {
              const priority = difficultyMap[r.difficulty] ?? 3;
              delete r.difficulty;
              r.priority = priority;
            }
            return r;
          });
        }
      });
    });
  }
}

// Singleton database instance
export const db = new CodeRepsDatabase();
