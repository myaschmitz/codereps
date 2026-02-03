"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { todoService } from "@/services/TodoService";
import { TodoItem } from "@/domain/models/TodoItem";
import {
  ArrowLeft,
  ListTodo,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import TodoInput from "@/components/TodoInput";
import TodoCard from "@/components/TodoCard";

export default function TodosPage() {
  const [pendingTodos, setPendingTodos] = useState<TodoItem[]>([]);
  const [completedTodos, setCompletedTodos] = useState<TodoItem[]>([]);
  const [showAllPending, setShowAllPending] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadTodos();
  }, [refreshKey]);

  const loadTodos = async () => {
    setIsLoading(true);
    try {
      const [pending, completed] = await Promise.all([
        todoService.getPendingTodos(),
        todoService.getCompletedTodos(),
      ]);
      setPendingTodos(pending);
      setCompletedTodos(completed);
    } catch (error) {
      console.error("Error loading todos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTodoAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await todoService.markComplete(id);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error completing todo:", error);
    }
  };

  const handleMarkIncomplete = async (id: string) => {
    try {
      await todoService.markIncomplete(id);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error uncompleting todo:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this to-do item?")) return;
    try {
      await todoService.deleteTodoItem(id);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const DISPLAY_LIMIT = 5;
  const visiblePending = showAllPending
    ? pendingTodos
    : pendingTodos.slice(0, DISPLAY_LIMIT);
  const hiddenPendingCount = Math.max(0, pendingTodos.length - DISPLAY_LIMIT);

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-purple-50/30 to-neutral-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <ListTodo className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              To-Do List
            </h1>
          </div>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Problems you want to attempt
          </p>
        </header>

        {/* Add Todo Input */}
        <div className="mb-8">
          <TodoInput onTodoAdded={handleTodoAdded} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Todos */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
              <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                To Do{" "}
                <span className="text-neutral-400 dark:text-neutral-500">
                  ({pendingTodos.length})
                </span>
              </h2>

              {pendingTodos.length === 0 ? (
                <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
                  No problems in your to-do list. Add some above!
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {visiblePending.map((todo) => (
                      <TodoCard
                        key={todo.id}
                        todo={todo}
                        onMarkComplete={handleMarkComplete}
                        onMarkIncomplete={handleMarkIncomplete}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>

                  {hiddenPendingCount > 0 && (
                    <button
                      onClick={() => setShowAllPending(!showAllPending)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      {showAllPending ? (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show fewer
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-4 w-4" />
                          Show {hiddenPendingCount} more
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Completed Todos */}
            {completedTodos.length > 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="mb-4 flex w-full items-center justify-between text-left"
                >
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Completed{" "}
                    <span className="text-neutral-400 dark:text-neutral-500">
                      ({completedTodos.length})
                    </span>
                  </h2>
                  {showCompleted ? (
                    <ChevronDown className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />
                  )}
                </button>

                {showCompleted && (
                  <div className="space-y-3">
                    {completedTodos.map((todo) => (
                      <TodoCard
                        key={todo.id}
                        todo={todo}
                        onMarkComplete={handleMarkComplete}
                        onMarkIncomplete={handleMarkIncomplete}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
