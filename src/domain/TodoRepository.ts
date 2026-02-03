import Fuse from "fuse.js";
import { TodoItem } from "./models/TodoItem";
import { db } from "../storage/IndexedDBAdapter";

/**
 * TodoRepository - DEEP MODULE
 *
 * Handles all persistence operations for to-do items.
 * Hides IndexedDB complexity behind a simple interface.
 */
export class TodoRepository {
  /**
   * Save or update a to-do item
   */
  async save(todoItem: TodoItem): Promise<void> {
    await db.todoItems.put(todoItem);
  }

  /**
   * Find a to-do item by ID
   * Returns null if not found
   */
  async findById(id: string): Promise<TodoItem | null> {
    const todoItem = await db.todoItems.get(id);
    return todoItem || null;
  }

  /**
   * Find a pending to-do item by name (case-insensitive)
   * Used for auto-completing todos when a problem is reviewed
   */
  async findPendingByName(name: string): Promise<TodoItem | null> {
    const todos = await db.todoItems
      .filter(
        (t) => !t.completed && t.name.toLowerCase() === name.toLowerCase(),
      )
      .first();
    return todos || null;
  }

  /**
   * Search to-do items by name (for fuzzy search dropdown)
   */
  async findByNamePattern(pattern: string): Promise<TodoItem[]> {
    const pendingTodos = await db.todoItems
      .filter((t) => !t.completed)
      .toArray();

    const fuse = new Fuse(pendingTodos, {
      keys: ["name"],
      threshold: 0.25,
      ignoreLocation: true,
    });

    return fuse.search(pattern).map((result) => result.item);
  }

  /**
   * Get all pending (incomplete) to-do items
   * Sorted by creation date (oldest first)
   */
  async getPending(): Promise<TodoItem[]> {
    const todos = await db.todoItems.filter((t) => !t.completed).toArray();
    return todos.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  /**
   * Get all completed to-do items
   * Sorted by completion date (newest first)
   */
  async getCompleted(): Promise<TodoItem[]> {
    const todos = await db.todoItems.filter((t) => t.completed).toArray();
    return todos.sort(
      (a, b) =>
        new Date(b.completedAt || b.createdAt).getTime() -
        new Date(a.completedAt || a.createdAt).getTime(),
    );
  }

  /**
   * Get all to-do items
   */
  async getAll(): Promise<TodoItem[]> {
    return await db.todoItems.toArray();
  }

  /**
   * Mark a to-do item as complete
   */
  async markComplete(id: string): Promise<void> {
    await db.todoItems.update(id, {
      completed: true,
      completedAt: new Date(),
    });
  }

  /**
   * Mark a to-do item as incomplete (undo)
   */
  async markIncomplete(id: string): Promise<void> {
    await db.todoItems.update(id, {
      completed: false,
      completedAt: undefined,
    });
  }

  /**
   * Delete a to-do item permanently
   */
  async delete(id: string): Promise<void> {
    await db.todoItems.delete(id);
  }

  /**
   * Delete all to-do items
   */
  async deleteAll(): Promise<void> {
    await db.todoItems.clear();
  }

  /**
   * Import multiple to-do items
   */
  async importMany(todoItems: TodoItem[]): Promise<void> {
    await db.todoItems.bulkPut(todoItems);
  }
}
