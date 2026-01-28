import Dexie, { Table } from "dexie";
import { Problem } from "../domain/models/Problem";

/**
 * IndexedDBAdapter - DEEP MODULE
 *
 * Wraps Dexie/IndexedDB complexity.
 * Provides type-safe database access.
 */
class CodeRepsDatabase extends Dexie {
  problems!: Table<Problem>;

  constructor() {
    super("CodeReps");

    this.version(1).stores({
      problems: "id, name, nextReviewDate, archived, createdAt",
    });
  }
}

// Singleton database instance
export const db = new CodeRepsDatabase();
