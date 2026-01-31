"use client";

import Link from "next/link";
import { ReviewItem } from "@/domain/ReviewQueue";
import { Difficulty } from "@/domain/models/Problem";
import { format } from "date-fns";
import { ChevronRight, Archive, Trash2, ExternalLink } from "lucide-react";

interface ReviewCardProps {
  review: ReviewItem;
  onArchive: (problemId: string) => void;
  onDelete: (problemId: string) => void;
}

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

export default function ReviewCard({
  review,
  onArchive,
  onDelete,
}: ReviewCardProps) {
  const { problem, isOverdue, isToday, daysOverdue } = review;

  const lastReview = problem.reviewHistory[problem.reviewHistory.length - 1];
  const leetcodeUrl = problem.number
    ? `https://leetcode.com/problems/${problem.name.toLowerCase().replace(/\s+/g, "-")}/`
    : null;

  return (
    <div
      className={`group rounded-lg border transition-colors ${
        isOverdue
          ? "border-red-200 bg-red-50/50 hover:bg-red-50 dark:border-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30"
          : "border-neutral-200 bg-neutral-50/50 hover:bg-neutral-100/50 dark:border-neutral-700 dark:bg-neutral-900/50 dark:hover:bg-neutral-800/50"
      }`}
    >
      <Link
        href={`/problem/${problem.id}`}
        className="flex items-start justify-between gap-4 p-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
              {problem.name}
            </h3>
            {problem.number && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                #{problem.number}
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

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {isOverdue && (
              <span className="font-medium text-red-600 dark:text-red-400">
                {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
              </span>
            )}
            {isToday && !isOverdue && (
              <span className="font-medium text-primary-600 dark:text-primary-400">
                Due today
              </span>
            )}
            {!isToday && !isOverdue && (
              <span className="text-neutral-600 dark:text-neutral-400">
                Due {format(problem.nextReviewDate, "MMM d, yyyy")}
              </span>
            )}
            <span className="text-neutral-400 dark:text-neutral-500">•</span>
            <span className="text-neutral-600 dark:text-neutral-400">
              {problem.reviewHistory.length} review
              {problem.reviewHistory.length !== 1 ? "s" : ""}
            </span>
            {lastReview && (
              <>
                <span className="text-neutral-400 dark:text-neutral-500">
                  •
                </span>
                {getDifficultyBadge(lastReview.difficulty)}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex gap-1"
            onClick={(e) => e.preventDefault()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(problem.id);
              }}
              className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-200 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              title="Archive"
            >
              <Archive className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(problem.id);
              }}
              className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:text-neutral-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <ChevronRight className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-0.5 dark:text-neutral-500" />
        </div>
      </Link>
    </div>
  );
}
