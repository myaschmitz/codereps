import Fuse from "fuse.js";
import { Problem } from "./models/Problem";
import { db } from "../storage/IndexedDBAdapter";

/**
 * ProblemRepository - DEEP MODULE
 *
 * Handles all persistence operations for problems.
 * Hides IndexedDB complexity behind a simple interface.
 */
export class ProblemRepository {
  /**
   * Save or update a problem
   */
  async save(problem: Problem): Promise<void> {
    await db.problems.put(problem);
  }

  /**
   * Find a problem by ID
   * Returns null if not found (no exception throwing)
   */
  async findById(id: string): Promise<Problem | null> {
    const problem = await db.problems.get(id);
    return problem || null;
  }

  /**
   * Search problems by name (for fuzzy search dropdown)
   */
  async findByNamePattern(pattern: string): Promise<Problem[]> {
    const allProblems = await db.problems.toArray();

    const fuse = new Fuse(allProblems, {
      keys: ["name"],
      threshold: 0.25,
      ignoreLocation: true,
    });

    return fuse.search(pattern).map((result) => result.item);
  }

  /**
   * Get all problems (unarchived by default)
   */
  async getAll(includeArchived = false): Promise<Problem[]> {
    if (includeArchived) {
      return await db.problems.toArray();
    }

    return await db.problems.filter((p) => !p.archived).toArray();
  }

  /**
   * Get only archived problems
   */
  async getArchived(): Promise<Problem[]> {
    return await db.problems.filter((p) => p.archived === true).toArray();
  }

  /**
   * Archive a problem
   */
  async archive(id: string): Promise<void> {
    await db.problems.update(id, { archived: true });
  }

  /**
   * Unarchive a problem
   */
  async unarchive(id: string): Promise<void> {
    await db.problems.update(id, { archived: false });
  }

  /**
   * Delete a problem permanently
   */
  async delete(id: string): Promise<void> {
    await db.problems.delete(id);
  }

  /**
   * Check if a problem with the same name exists
   */
  async existsByName(name: string): Promise<Problem | null> {
    const problems = await db.problems
      .where("name")
      .equalsIgnoreCase(name)
      .first();

    return problems || null;
  }

  /**
   * Delete all problems from the database
   */
  async deleteAll(): Promise<void> {
    await db.problems.clear();
  }

  /**
   * Import multiple problems, replacing any with matching IDs
   */
  async importMany(problems: Problem[]): Promise<void> {
    await db.problems.bulkPut(problems);
  }
}
