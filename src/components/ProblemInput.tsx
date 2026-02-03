"use client";

import { useState, useEffect, useRef } from "react";
import { reviewService } from "@/services/ReviewService";
import { todoService } from "@/services/TodoService";
import { Problem, Difficulty } from "@/domain/models/Problem";
import { TodoItem } from "@/domain/models/TodoItem";
import { format } from "date-fns";
import { Search, ListTodo } from "lucide-react";

type SuggestionItem =
  | { type: "problem"; data: Problem }
  | { type: "todo"; data: TodoItem };

interface ProblemInputProps {
  onProblemAdded: () => void;
}

export default function ProblemInput({ onProblemAdded }: ProblemInputProps) {
  const [problemName, setProblemName] = useState("");
  const [problemNumber, setProblemNumber] = useState("");
  const [reviewDate, setReviewDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [selectedFromTodo, setSelectedFromTodo] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search for existing problems and todos as user types
  useEffect(() => {
    const searchAll = async () => {
      if (problemName.length > 0) {
        const [problems, todos] = await Promise.all([
          reviewService.searchProblems(problemName),
          todoService.searchTodos(problemName),
        ]);

        const suggestionItems: SuggestionItem[] = [
          ...todos.map((todo) => ({ type: "todo" as const, data: todo })),
          ...problems.map((problem) => ({ type: "problem" as const, data: problem })),
        ];

        setSuggestions(suggestionItems);
        setShowSuggestions(suggestionItems.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounce = setTimeout(searchAll, 200);
    return () => clearTimeout(debounce);
  }, [problemName]);

  const handleSelectSuggestion = (suggestion: SuggestionItem) => {
    if (suggestion.type === "problem") {
      setSelectedProblem(suggestion.data);
      setProblemName(suggestion.data.name);
      setProblemNumber(suggestion.data.number?.toString() || "");
      setSelectedFromTodo(false);
    } else {
      // It's a todo item
      setSelectedProblem(null);
      setProblemName(suggestion.data.name);
      setProblemNumber(suggestion.data.number?.toString() || "");
      setSelectedFromTodo(true);
    }
    setShowSuggestions(false);
  };

  const handleSubmit = async (difficulty: Difficulty) => {
    if (!problemName.trim()) return;

    setIsSubmitting(true);
    setSelectedDifficulty(difficulty);

    try {
      const parsedDate = new Date(reviewDate);

      if (selectedProblem) {
        // Recording a review for existing problem
        await reviewService.recordReview(
          selectedProblem.id,
          difficulty,
          parsedDate,
          reviewNotes.trim() || undefined,
        );
      } else {
        // Adding a new problem
        // Parse problem number, ensuring it's a valid positive integer
        const parsedNumber = problemNumber ? parseInt(problemNumber, 10) : NaN;
        const validNumber = !isNaN(parsedNumber) && parsedNumber > 0 ? parsedNumber : undefined;

        const problem = await reviewService.addProblem(
          problemName.trim(),
          validNumber,
          parsedDate,
        );

        // If it's a new problem, record the initial review
        await reviewService.recordReview(
          problem.id,
          difficulty,
          parsedDate,
          reviewNotes.trim() || undefined,
        );
      }

      // Auto-complete matching todo when a problem is reviewed
      await todoService.markCompleteByName(problemName.trim());

      // Reset form
      setProblemName("");
      setProblemNumber("");
      setReviewDate(format(new Date(), "yyyy-MM-dd"));
      setReviewNotes("");
      setSelectedProblem(null);
      setSelectedFromTodo(false);
      setSelectedDifficulty(null);
      onProblemAdded();
    } catch (error) {
      console.error("Error adding problem:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        {selectedProblem ? "Record Review" : "Add Problem"}
      </h2>

      {/* Problem Name Input with Autocomplete */}
      <div className="relative mb-4">
        <label
          htmlFor="problem-name"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Problem Name
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            id="problem-name"
            type="text"
            value={problemName}
            onChange={(e) => {
              setProblemName(e.target.value);
              setSelectedProblem(null);
              setSelectedFromTodo(false);
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => {
              // Delay hiding to allow clicking on suggestions
              setTimeout(() => setShowSuggestions(false), 150);
            }}
            placeholder="e.g., Two Sum"
            className="min-w-0 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 pl-10 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" />
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-600 dark:bg-neutral-700">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion.type === "problem" ? suggestion.data.id : `todo-${suggestion.data.id}`}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-600"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {suggestion.data.name}
                  </span>
                  {suggestion.type === "todo" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      <ListTodo className="h-3 w-3" />
                      To-Do
                    </span>
                  )}
                </div>
                {suggestion.data.number && (
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    #{suggestion.data.number}
                  </div>
                )}
                {suggestion.type === "problem" && (
                  <div className="text-xs text-neutral-400 dark:text-neutral-500">
                    {suggestion.data.reviewHistory.length} review
                    {suggestion.data.reviewHistory.length !== 1 ? "s" : ""}
                  </div>
                )}
                {suggestion.type === "todo" && suggestion.data.note && (
                  <div className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                    {suggestion.data.note}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Problem Number */}
      <div className="mb-4">
        <label
          htmlFor="problem-number"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Problem Number{" "}
          <span className="text-neutral-400 dark:text-neutral-500">
            (optional)
          </span>
        </label>
        <input
          id="problem-number"
          type="number"
          min="1"
          value={problemNumber}
          onChange={(e) => setProblemNumber(e.target.value)}
          placeholder="e.g., 1"
          className="min-w-0 w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </div>

      {/* Review Date */}
      <div className="mb-6 max-w-full">
        <label
          htmlFor="review-date"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Review Date
        </label>
        <div className="relative max-w-full">
          <input
            id="review-date"
            type="date"
            value={reviewDate}
            onChange={(e) => setReviewDate(e.target.value)}
            className="min-w-0 max-w-full w-full rounded-lg border border-neutral-300 bg-white sm:px-4 py-2.5 text-neutral-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:[color-scheme:dark]"
          />
        </div>
      </div>

      {/* Review Notes */}
      <div className="mb-6">
        <label
          htmlFor="review-notes"
          className="mb-1.5 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Notes{" "}
          <span className="text-neutral-400 dark:text-neutral-500">
            (optional)
          </span>
        </label>
        <textarea
          id="review-notes"
          value={reviewNotes}
          onChange={(e) => setReviewNotes(e.target.value)}
          placeholder="e.g., Struggled with the two-pointer approach"
          rows={2}
          className="min-w-0 w-full resize-none rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
        />
      </div>

      {/* Difficulty Buttons */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          How did it go?
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <DifficultyButton
            difficulty={Difficulty.EASY}
            label="Easy"
            color="green"
            onClick={() => handleSubmit(Difficulty.EASY)}
            isLoading={isSubmitting && selectedDifficulty === Difficulty.EASY}
            disabled={isSubmitting || !problemName.trim()}
          />
          <DifficultyButton
            difficulty={Difficulty.MEDIUM}
            label="Medium"
            color="yellow"
            onClick={() => handleSubmit(Difficulty.MEDIUM)}
            isLoading={isSubmitting && selectedDifficulty === Difficulty.MEDIUM}
            disabled={isSubmitting || !problemName.trim()}
          />
          <DifficultyButton
            difficulty={Difficulty.HARD}
            label="Hard"
            color="orange"
            onClick={() => handleSubmit(Difficulty.HARD)}
            isLoading={isSubmitting && selectedDifficulty === Difficulty.HARD}
            disabled={isSubmitting || !problemName.trim()}
          />
          <DifficultyButton
            difficulty={Difficulty.DIDNT_GET}
            label="Didn't Get"
            color="red"
            onClick={() => handleSubmit(Difficulty.DIDNT_GET)}
            isLoading={
              isSubmitting && selectedDifficulty === Difficulty.DIDNT_GET
            }
            disabled={isSubmitting || !problemName.trim()}
          />
        </div>
      </div>
    </div>
  );
}

interface DifficultyButtonProps {
  difficulty: Difficulty;
  label: string;
  color: "green" | "yellow" | "orange" | "red";
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
}

function DifficultyButton({
  label,
  color,
  onClick,
  isLoading,
  disabled,
}: DifficultyButtonProps) {
  const colorClasses = {
    green:
      "bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:bg-green-300",
    yellow:
      "bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 disabled:bg-yellow-300",
    orange:
      "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-orange-300",
    red: "bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:bg-red-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-4 py-3 font-medium text-white transition-all ${colorClasses[color]} disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        label
      )}
    </button>
  );
}
