"use client";

import { useState, useRef } from "react";
import { todoService } from "@/services/TodoService";
import { Plus } from "lucide-react";

interface TodoInputProps {
  onTodoAdded: () => void;
}

export default function TodoInput({ onTodoAdded }: TodoInputProps) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      // Parse number, ensuring it's a valid positive integer
      const parsedNumber = number ? parseInt(number, 10) : NaN;
      const validNumber = !isNaN(parsedNumber) && parsedNumber > 0 ? parsedNumber : undefined;

      await todoService.addTodoItem(
        name.trim(),
        validNumber,
        note.trim() || undefined,
      );
      setName("");
      setNumber("");
      setNote("");
      onTodoAdded();
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error adding todo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
    >
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        Add Problem to Do
      </h2>

      {/* Name Input */}
      <div className="mb-4">
        <label
          htmlFor="todo-name"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Problem Name
        </label>
        <input
          ref={inputRef}
          id="todo-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Merge K Sorted Lists"
          className="min-w-0 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </div>

      {/* Problem Number */}
      <div className="mb-4">
        <label
          htmlFor="todo-number"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Problem Number{" "}
          <span className="text-neutral-400 dark:text-neutral-500">
            (optional)
          </span>
        </label>
        <input
          id="todo-number"
          type="number"
          min="1"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="e.g., 23"
          className="min-w-0 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </div>

      {/* Note Input (optional) */}
      <div className="mb-4">
        <label
          htmlFor="todo-note"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Note{" "}
          <span className="text-neutral-400 dark:text-neutral-500">
            (optional)
          </span>
        </label>
        <textarea
          id="todo-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g., Practice heap operations first"
          rows={2}
          className="min-w-0 w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 py-3 font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:bg-purple-300"
      >
        {isSubmitting ? (
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <>
            <Plus className="h-5 w-5" />
            Add to List
          </>
        )}
      </button>
    </form>
  );
}
