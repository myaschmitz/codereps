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
  }
}

// Singleton database instance
export const db = new CodeRepsDatabase();
