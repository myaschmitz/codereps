"use client";

import { TodoItem } from "@/domain/models/TodoItem";
import { format } from "date-fns";
import { Check, RotateCcw, Trash2, ExternalLink } from "lucide-react";

interface TodoCardProps {
  todo: TodoItem;
  onMarkComplete: (id: string) => void;
  onMarkIncomplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TodoCard({
  todo,
  onMarkComplete,
  onMarkIncomplete,
  onDelete,
}: TodoCardProps) {
  const leetcodeUrl = todo.number
    ? `https://leetcode.com/problems/${todo.name.toLowerCase().replace(/\s+/g, "-")}/`
    : null;

  return (
    <div
      className={`group rounded-lg border transition-colors ${
        todo.completed
          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20"
          : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/50 dark:border-neutral-700 dark:bg-neutral-900/50 dark:hover:bg-neutral-800/50"
      }`}
    >
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-medium ${
                todo.completed
                  ? "text-neutral-500 line-through dark:text-neutral-400"
                  : "text-neutral-900 dark:text-neutral-100"
              }`}
            >
              {todo.name}
            </h3>
            {todo.number && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                #{todo.number}
              </span>
            )}
            {leetcodeUrl && (
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(leetcodeUrl, "_blank", "noopener,noreferrer");
                }}
                className="text-primary-600 hover:text-primary-700 transition-colors dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer"
                title="Open on LeetCode"
              >
                <ExternalLink className="h-4 w-4" />
              </span>
            )}
          </div>

          {todo.note && (
            <p
              className={`mt-1 text-sm ${
                todo.completed
                  ? "text-neutral-400 dark:text-neutral-500"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {todo.note}
            </p>
          )}

          <div className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            Added {format(new Date(todo.createdAt), "MMM d, yyyy")}
            {todo.completedAt && (
              <>
                {" "}
                • Completed {format(new Date(todo.completedAt), "MMM d, yyyy")}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {todo.completed ? (
            <button
              onClick={() => onMarkIncomplete(todo.id)}
              className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              title="Mark incomplete"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => onMarkComplete(todo.id)}
              className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-100 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300"
              title="Mark complete"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(todo.id)}
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:text-neutral-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
