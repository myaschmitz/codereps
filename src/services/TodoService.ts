import { TodoItem, createTodoItem } from "../domain/models/TodoItem";
import { TodoRepository } from "../domain/TodoRepository";

/**
 * TodoService - APPLICATION SERVICE (THIN)
 *
 * Orchestrates to-do operations.
 * Doesn't contain business logic - delegates to deep modules.
 */
export class TodoService {
  private repository: TodoRepository;

  constructor() {
    this.repository = new TodoRepository();
  }

  /**
   * Add a new to-do item
   */
  async addTodoItem(
    name: string,
    number?: number,
    note?: string,
  ): Promise<TodoItem> {
    const todoItem = createTodoItem(name, number, note);
    await this.repository.save(todoItem);
    return todoItem;
  }

  /**
   * Get all pending to-do items
   */
  async getPendingTodos(): Promise<TodoItem[]> {
    return await this.repository.getPending();
  }

  /**
   * Get all completed to-do items
   */
  async getCompletedTodos(): Promise<TodoItem[]> {
    return await this.repository.getCompleted();
  }

  /**
   * Search todos by name (for autocomplete)
   */
  async searchTodos(query: string): Promise<TodoItem[]> {
    if (!query.trim()) {
      return [];
    }
    return await this.repository.findByNamePattern(query);
  }

  /**
   * Mark item as complete by ID
   */
  async markComplete(id: string): Promise<void> {
    await this.repository.markComplete(id);
  }

  /**
   * Mark item as complete by name (case-insensitive)
   * Used when a problem is reviewed - automatically completes matching todo
   * Returns true if a todo was found and completed
   */
  async markCompleteByName(name: string): Promise<boolean> {
    const todo = await this.repository.findPendingByName(name);
    if (todo) {
      await this.repository.markComplete(todo.id);
      return true;
    }
    return false;
  }

  /**
   * Mark item as incomplete
   */
  async markIncomplete(id: string): Promise<void> {
    await this.repository.markIncomplete(id);
  }

  /**
   * Delete a to-do item
   */
  async deleteTodoItem(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Update a to-do item's name, number, or note
   */
  async updateTodoItem(
    id: string,
    updates: { name?: string; number?: number; note?: string },
  ): Promise<TodoItem> {
    const todoItem = await this.repository.findById(id);
    if (!todoItem) {
      throw new Error("Todo item not found");
    }

    if (updates.name !== undefined) {
      todoItem.name = updates.name;
    }
    if (updates.number !== undefined) {
      todoItem.number = updates.number || undefined;
    }
    if (updates.note !== undefined) {
      todoItem.note = updates.note || undefined;
    }

    await this.repository.save(todoItem);
    return todoItem;
  }

  /**
   * Get to-do item by ID
   */
  async getTodoItem(id: string): Promise<TodoItem | null> {
    return await this.repository.findById(id);
  }

  /**
   * Export all todos (for backup integration)
   */
  async exportData(): Promise<TodoItem[]> {
    return await this.repository.getAll();
  }

  /**
   * Import todos (for restore integration)
   */
  async importData(todos: TodoItem[]): Promise<number> {
    const processedTodos = todos.map((todo) => ({
      ...todo,
      createdAt: new Date(todo.createdAt),
      completedAt: todo.completedAt ? new Date(todo.completedAt) : undefined,
    }));

    await this.repository.importMany(processedTodos);
    return processedTodos.length;
  }

  /**
   * Clear all todos (for reset integration)
   */
  async deleteAll(): Promise<void> {
    await this.repository.deleteAll();
  }
}

// Singleton instance
export const todoService = new TodoService();
