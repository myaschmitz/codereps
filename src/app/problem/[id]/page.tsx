"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { reviewService } from "@/services/ReviewService";
import { Problem, Difficulty, ReviewRecord } from "@/domain/models/Problem";
import { format } from "date-fns";
import {
  ArrowLeft,
  ExternalLink,
  Calendar,
  CalendarClock,
  Pencil,
  Check,
  X,
  Archive,
  Trash2,
} from "lucide-react";

const getDifficultyBadge = (difficulty: Difficulty) => {
  const badges = {
    [Difficulty.EASY]:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    [Difficulty.MEDIUM]:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    [Difficulty.HARD]:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    [Difficulty.DIDNT_GET]:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const labels = {
    [Difficulty.EASY]: "Easy",
    [Difficulty.MEDIUM]: "Medium",
    [Difficulty.HARD]: "Hard",
    [Difficulty.DIDNT_GET]: "Didn't Get",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${badges[difficulty]}`}
    >
      {labels[difficulty]}
    </span>
  );
};

interface EditState {
  date: string; // ISO date string for input
  difficulty: Difficulty;
  note: string;
}

export default function ProblemDetailPage() {
  const router = useRouter();
  const params = useParams();
  const problemId = params.id as string;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState>({
    date: "",
    difficulty: Difficulty.MEDIUM,
    note: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (problemId) {
      loadProblem();
    }
  }, [problemId]);

  const loadProblem = async () => {
    setIsLoading(true);
    try {
      const p = await reviewService.getProblem(problemId);
      setProblem(p);
    } catch (error) {
      console.error("Error loading problem:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleArchive = async () => {
    if (!problem) return;
    try {
      await reviewService.archiveProblem(problem.id);
      router.back();
    } catch (error) {
      console.error("Error archiving problem:", error);
    }
  };

  const handleDelete = async () => {
    if (!problem) return;
    if (
      !confirm(
        "Are you sure you want to delete this problem? This cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await reviewService.deleteProblem(problem.id);
      router.back();
    } catch (error) {
      console.error("Error deleting problem:", error);
    }
  };

  const handleStartEdit = (index: number, record: ReviewRecord) => {
    setEditingIndex(index);
    setEditState({
      date: format(new Date(record.date), "yyyy-MM-dd"),
      difficulty: record.difficulty,
      note: record.notes || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditState({ date: "", difficulty: Difficulty.MEDIUM, note: "" });
  };

  const handleSaveReview = async (index: number) => {
    if (!problem) return;
    setIsSaving(true);
    try {
      await reviewService.updateReviewRecord(problem.id, index, {
        date: new Date(editState.date),
        difficulty: editState.difficulty,
        note: editState.note,
      });
      await loadProblem();
      setEditingIndex(null);
      setEditState({ date: "", difficulty: Difficulty.MEDIUM, note: "" });
    } catch (error) {
      console.error("Error saving review:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-orange-50/30 to-neutral-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        </div>
      </main>
    );
  }

  if (!problem) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-orange-50/30 to-neutral-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
            Problem not found
          </div>
        </div>
      </main>
    );
  }

  const leetcodeUrl = problem.number
    ? `https://leetcode.com/problems/${problem.name.toLowerCase().replace(/\s+/g, "-")}/`
    : null;

  const lastReview = problem.reviewHistory[problem.reviewHistory.length - 1];
  const isToday =
    format(problem.nextReviewDate, "yyyy-MM-dd") ===
    format(new Date(), "yyyy-MM-dd");
  const isOverdue = problem.nextReviewDate < new Date() && !isToday;

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-orange-50/30 to-neutral-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="mb-6 flex items-center gap-2 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>

        {/* Problem Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {problem.name}
                </h1>
                {problem.number && (
                  <span className="text-lg text-neutral-500 dark:text-neutral-400">
                    #{problem.number}
                  </span>
                )}
                {leetcodeUrl && (
                  <a
                    href={leetcodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 transition-colors dark:text-primary-400 dark:hover:text-primary-300"
                    title="Open on LeetCode"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                )}
              </div>

              <div className="mt-3 flex flex-wrap flex-col items-start gap-1 text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">
                  {problem.reviewHistory.length} review
                  {problem.reviewHistory.length !== 1 ? "s" : ""}
                </span>
                {lastReview && (
                  <>
                    {/* <span className="text-neutral-400 dark:text-neutral-500">
                      |
                    </span> */}
                    <div className="text-neutral-600 dark:text-neutral-400 flex flex-wrap gap-2">
                      Last difficulty:
                      {getDifficultyBadge(lastReview.difficulty)}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleArchive}
                className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
                title="Archive"
              >
                <Archive className="h-5 w-5" />
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:text-neutral-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          <hr className="my-6 border-neutral-200 dark:border-neutral-700" />

          {/* Next Review Date */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <CalendarClock className="h-4 w-4 text-primary-500" />
              <span className="font-bold">Next Review</span>
            </div>
            <p className="ml-6 mt-2 text-neutral-600 dark:text-neutral-400">
              {format(problem.nextReviewDate, "EEEE, MMMM d, yyyy")}
              {isToday && (
                <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  Today
                </span>
              )}
              {isOverdue && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Overdue
                </span>
              )}
            </p>
          </div>

          {/* Review History */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <Calendar className="h-4 w-4 text-neutral-500" />
              <span className="font-bold">Review History</span>
            </div>

            {problem.reviewHistory.length === 0 ? (
              <p className="ml-6 mt-3 text-sm italic text-neutral-500 dark:text-neutral-400">
                No reviews recorded yet
              </p>
            ) : (
              <div className="ml-6 mt-3 space-y-3">
                {[...problem.reviewHistory]
                  .reverse()
                  .map((reviewRecord, reverseIndex) => {
                    const actualIndex =
                      problem.reviewHistory.length - 1 - reverseIndex;
                    return (
                      <ReviewHistoryItem
                        key={actualIndex}
                        reviewRecord={reviewRecord}
                        index={actualIndex}
                        isEditing={editingIndex === actualIndex}
                        editState={editState}
                        isSaving={isSaving}
                        onStartEdit={handleStartEdit}
                        onCancelEdit={handleCancelEdit}
                        onSaveReview={handleSaveReview}
                        onEditStateChange={setEditState}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

interface ReviewHistoryItemProps {
  reviewRecord: ReviewRecord;
  index: number;
  isEditing: boolean;
  editState: EditState;
  isSaving: boolean;
  onStartEdit: (index: number, record: ReviewRecord) => void;
  onCancelEdit: () => void;
  onSaveReview: (index: number) => void;
  onEditStateChange: (state: EditState) => void;
}

const difficultyOptions = [
  { value: Difficulty.EASY, label: "Easy" },
  { value: Difficulty.MEDIUM, label: "Medium" },
  { value: Difficulty.HARD, label: "Hard" },
  { value: Difficulty.DIDNT_GET, label: "Didn't Get" },
];

function ReviewHistoryItem({
  reviewRecord,
  index,
  isEditing,
  editState,
  isSaving,
  onStartEdit,
  onCancelEdit,
  onSaveReview,
  onEditStateChange,
}: ReviewHistoryItemProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-900/50">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-neutral-700 dark:text-neutral-300">
            {format(new Date(reviewRecord.date), "MMM d, yyyy")}
          </span>
          {getDifficultyBadge(reviewRecord.difficulty)}
        </div>
        {!isEditing && (
          <button
            onClick={() => onStartEdit(index, reviewRecord)}
            className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-300"
            title="Edit review"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-3 space-y-3">
          {/* Date input */}
          <div>
            <label
              htmlFor={`review-date-${index}`}
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Date
            </label>
            <input
              id={`review-date-${index}`}
              type="date"
              value={editState.date}
              onChange={(e) =>
                onEditStateChange({ ...editState, date: e.target.value })
              }
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </div>

          {/* Difficulty select */}
          <div>
            <label
              htmlFor={`review-difficulty-${index}`}
              className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400"
            >
              Difficulty
            </label>
            <select
              id={`review-difficulty-${index}`}
              value={editState.difficulty}
              onChange={(e) =>
                onEditStateChange({
                  ...editState,
                  difficulty: e.target.value as Difficulty,
                })
              }
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
            >
              {difficultyOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Note textarea */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
              Note (optional)
            </label>
            <textarea
              value={editState.note}
              onChange={(e) =>
                onEditStateChange({ ...editState, note: e.target.value })
              }
              placeholder="Add a note for this review..."
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onCancelEdit}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={() => onSaveReview(index)}
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        reviewRecord.notes && (
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            {reviewRecord.notes}
          </p>
        )
      )}
    </div>
  );
}
