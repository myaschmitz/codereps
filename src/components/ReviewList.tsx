"use client";

import { useState, useEffect } from "react";
import { reviewService } from "@/services/ReviewService";
import { ReviewItem } from "@/domain/ReviewQueue";
import { Difficulty } from "@/domain/models/Problem";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Archive,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface ReviewListProps {
  refreshKey?: number;
  onStatsChange: () => void;
}

export default function ReviewList({
  refreshKey,
  onStatsChange,
}: ReviewListProps) {
  const [todaysReviews, setTodaysReviews] = useState<ReviewItem[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<ReviewItem[]>([]);
  const [showAllTodays, setShowAllTodays] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [refreshKey]);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const [todays, upcoming] = await Promise.all([
        reviewService.getTodaysReviews(),
        reviewService.getUpcomingReviews(),
      ]);
      setTodaysReviews(todays);
      setUpcomingReviews(upcoming);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (problemId: string) => {
    try {
      await reviewService.archiveProblem(problemId);
      await loadReviews();
      onStatsChange();
    } catch (error) {
      console.error("Error archiving problem:", error);
    }
  };

  const handleDelete = async (problemId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this problem? This cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await reviewService.deleteProblem(problemId);
      await loadReviews();
      onStatsChange();
    } catch (error) {
      console.error("Error deleting problem:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  const REVIEW_LIMIT = 3;
  const visibleTodays = showAllTodays
    ? todaysReviews
    : todaysReviews.slice(0, REVIEW_LIMIT);
  const hiddenTodaysCount = Math.max(0, todaysReviews.length - REVIEW_LIMIT);

  return (
    <div className="space-y-6">
      {/* Today's Reviews */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Today&apos;s Reviews{" "}
            <span className="text-neutral-400">({todaysReviews.length})</span>
          </h2>
          {todaysReviews.some((r) => r.isOverdue) && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
              {todaysReviews.filter((r) => r.isOverdue).length} overdue
            </span>
          )}
        </div>

        {todaysReviews.length === 0 ? (
          <div className="py-8 text-center text-neutral-500">
            No reviews due today. Great job! 🎉
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visibleTodays.map((review) => (
                <ReviewCard
                  key={review.problem.id}
                  review={review}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {hiddenTodaysCount > 0 && (
              <button
                onClick={() => setShowAllTodays(!showAllTodays)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
              >
                {showAllTodays ? (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show fewer
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    Show {hiddenTodaysCount} more review
                    {hiddenTodaysCount !== 1 ? "s" : ""}
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* Upcoming Reviews */}
      {upcomingReviews.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <button
            onClick={() => setShowUpcoming(!showUpcoming)}
            className="mb-4 flex w-full items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold text-neutral-900">
              Upcoming Reviews{" "}
              <span className="text-neutral-400">
                ({upcomingReviews.length})
              </span>
            </h2>
            {showUpcoming ? (
              <ChevronDown className="h-5 w-5 text-neutral-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-neutral-400" />
            )}
          </button>

          {showUpcoming && (
            <div className="space-y-3">
              {upcomingReviews.map((review) => (
                <ReviewCard
                  key={review.problem.id}
                  review={review}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ReviewCardProps {
  review: ReviewItem;
  onArchive: (problemId: string) => void;
  onDelete: (problemId: string) => void;
}

function ReviewCard({ review, onArchive, onDelete }: ReviewCardProps) {
  const { problem, isOverdue, isToday, daysOverdue } = review;

  const getDifficultyBadge = (difficulty: Difficulty) => {
    const badges = {
      [Difficulty.EASY]: "bg-green-100 text-green-700",
      [Difficulty.MEDIUM]: "bg-yellow-100 text-yellow-700",
      [Difficulty.HARD]: "bg-orange-100 text-orange-700",
      [Difficulty.DIDNT_GET]: "bg-red-100 text-red-700",
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

  const lastReview = problem.reviewHistory[problem.reviewHistory.length - 1];
  const leetcodeUrl = problem.number
    ? `https://leetcode.com/problems/${problem.name.toLowerCase().replace(/\s+/g, "-")}/`
    : null;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isOverdue
          ? "border-red-200 bg-red-50/50"
          : "border-neutral-200 bg-neutral-50/50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-neutral-900">{problem.name}</h3>
            {problem.number && (
              <span className="text-sm text-neutral-500">
                #{problem.number}
              </span>
            )}
            {leetcodeUrl && (
              <a
                href={leetcodeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 transition-colors"
                title="Open on LeetCode"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            {isOverdue && (
              <span className="font-medium text-red-600">
                {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue
              </span>
            )}
            {isToday && !isOverdue && (
              <span className="font-medium text-primary-600">Due today</span>
            )}
            {!isToday && !isOverdue && (
              <span className="text-neutral-600">
                Due {format(problem.nextReviewDate, "MMM d, yyyy")}
              </span>
            )}
            <span className="text-neutral-400">•</span>
            <span className="text-neutral-600">
              {problem.reviewHistory.length} review
              {problem.reviewHistory.length !== 1 ? "s" : ""}
            </span>
            {lastReview && (
              <>
                <span className="text-neutral-400">•</span>
                {getDifficultyBadge(lastReview.difficulty)}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onArchive(problem.id)}
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            title="Archive"
          >
            <Archive className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(problem.id)}
            className="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-red-100 hover:text-red-700"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
